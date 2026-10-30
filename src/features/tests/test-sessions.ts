import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { clamp } from "es-toolkit";
import { cache } from "react";
import { z } from "zod";
import { testDraft, type Visit } from "@/db/columns";
import { attempts, taskSessions, testSessions } from "@/db/schema";
import { checkerVersion } from "@/features/catalog/checker";
import { positions } from "@/features/catalog/exams";
import { maxParts } from "@/features/catalog/parts";
import { getTask } from "@/features/catalog/tasks";
import { getVariant, minutesOf, slotsOf } from "@/features/variants/variants";
import { weeklyVariant } from "@/features/variants/weekly";
import { minuteMs } from "@/lib/dates";
import { db, type Tx } from "@/server/db";
import { gradeTest } from "./grade";
import { review } from "./review";
import { overtimeAt } from "./state";

export const testInput = z.object({
  id: z.uuid(),
  variantId: z.string().refine((id) => getVariant(id) !== undefined),
  startedAt: z.number().int(),
  draft: testDraft({ tasks: positions.length, parts: maxParts }),
});

export type TestInput = z.infer<typeof testInput>;

export type UnfinishedTest = TestInput & { updatedAt: number };

function variantOf(variantId: string) {
  const variant = getVariant(variantId);
  if (!variant) throw new Error(`unknown variant ${variantId}`);
  return variant;
}

const upsert = (
  executor: Pick<typeof db, "insert">,
  profileId: string,
  { id, variantId, startedAt, draft }: TestInput,
  set: Partial<typeof testSessions.$inferInsert>,
) => {
  const variant = variantOf(variantId);
  const now = new Date();
  return executor
    .insert(testSessions)
    .values({
      id,
      profileId,
      kind: variant.kind,
      variantId,
      taskIds: variant.taskIds,
      startedAt: new Date(Math.min(startedAt, now.getTime())),
      draft,
      ...set,
    })
    .onConflictDoUpdate({
      target: testSessions.id,
      set: { draft, updatedAt: now, ...set },
      setWhere: and(
        eq(testSessions.profileId, profileId),
        isNull(testSessions.finishedAt),
      ),
    })
    .returning({
      startedAt: testSessions.startedAt,
      taskIds: testSessions.taskIds,
    });
};

export async function saveDraft(profileId: string, test: TestInput) {
  await upsert(db, profileId, test, {});
}

function sessionsOf(
  visits: Visit[],
  taskIds: string[],
  startedAt: number,
  now: number,
) {
  return visits.flatMap((visit) => {
    const taskId = taskIds[visit.task];
    if (!taskId) return [];
    const start = clamp(visit.startedAt, startedAt, now);
    const end = clamp(visit.endedAt, start, now);
    return [{ ...visit, taskId, start, end }];
  });
}

async function storeAttempts(
  tx: Tx,
  profileId: string,
  testSessionId: string,
  graded: ReturnType<typeof gradeTest>,
  sessions: ReturnType<typeof sessionsOf>,
  now: number,
  tz: string | undefined,
) {
  for (const g of graded.filter((g) => g.answered)) {
    const last = sessions.findLast((s) => s.taskId === g.taskId);
    const [session] = last
      ? [{ id: last.id }]
      : await tx
          .insert(taskSessions)
          .values({
            profileId,
            taskId: g.taskId,
            testSessionId,
            kind: "mock",
            tz,
            startedAt: new Date(now),
            lastSeenAt: new Date(now),
          })
          .returning({ id: taskSessions.id });
    const task = getTask(g.taskId);
    if (!session || !task) continue;
    await tx.insert(attempts).values({
      profileId,
      taskId: g.taskId,
      sessionId: session.id,
      answers: g.answers,
      outcomes: g.outcomes,
      correct: g.correct,
      difficulty: task.difficulty,
      keyRev: task.keyRev,
      checker: checkerVersion,
    });
  }
}

export async function finishTest(
  profileId: string,
  test: TestInput,
  tz: string | undefined,
) {
  const variant = variantOf(test.variantId);
  const minutes = minutesOf(variant);
  const now = Date.now();
  const finished = await db.transaction(async (tx) => {
    const [stored] = await upsert(tx, profileId, test, {
      draft: null,
      finishedAt: new Date(now),
    });
    if (!stored) return;
    const startedAt = stored.startedAt.getTime();
    const overtime = overtimeAt({ startedAt, minutes }, now);
    await tx
      .update(testSessions)
      .set({ overtime })
      .where(
        and(
          eq(testSessions.id, test.id),
          eq(testSessions.profileId, profileId),
        ),
      );
    const sessions = sessionsOf(
      test.draft.visits,
      stored.taskIds,
      startedAt,
      now,
    );
    if (sessions.length > 0) {
      await tx
        .insert(taskSessions)
        .values(
          sessions.map((s) => ({
            id: s.id,
            profileId,
            taskId: s.taskId,
            testSessionId: test.id,
            kind: "mock" as const,
            tz,
            startedAt: new Date(s.start),
            lastSeenAt: new Date(s.end),
          })),
        )
        .onConflictDoNothing();
    }
    const graded = gradeTest(
      stored.taskIds.map((taskId) => ({
        taskId,
        expected: getTask(taskId)?.check.map((c) => c.expected) ?? [],
      })),
      test.draft.answers,
    );
    await storeAttempts(tx, profileId, test.id, graded, sessions, now, tz);
    return { startedAt, overtime, graded };
  });
  if (!finished) return;
  const { startedAt, overtime, graded } = finished;
  const answered = graded.filter((g) => g.answered);
  const { score, max, correct } = review(
    slotsOf(graded.map((g) => g.taskId)),
    answered,
  );
  return {
    test_session_id: test.id,
    variant_id: variant.id,
    variant_kind: variant.kind,
    tasks: graded.length,
    minutes,
    weekly: weeklyVariant()?.id === variant.id,
    answered: answered.length,
    correct,
    score,
    max_points: max,
    elapsed_ms: now - startedAt,
    overtime,
    overtime_ms: overtime ? now - startedAt - minutes * minuteMs : undefined,
    unanswered: graded.flatMap((g, i) => (g.answered ? [] : [i + 1])),
    visits: test.draft.visits.length,
    positions_visited: new Set(test.draft.visits.map((v) => v.task)).size,
  };
}

export const getUnfinishedTest = cache(
  async (
    profileId: string,
    variantId: string,
  ): Promise<UnfinishedTest | undefined> => {
    const [row] = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.profileId, profileId),
          isNull(testSessions.finishedAt),
          eq(testSessions.variantId, variantId),
        ),
      )
      .orderBy(desc(testSessions.updatedAt))
      .limit(1);
    if (!row?.draft) return undefined;
    return {
      id: row.id,
      variantId: row.variantId,
      startedAt: row.startedAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
      draft: row.draft,
    };
  },
);
