import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import { attempts, taskSessions, testSessions } from "@/db/schema";
import { getTask } from "@/features/tasks/tasks";
import { checkerVersion } from "@/lib/math";
import { db } from "@/server/db";
import { gradeTest } from "./grade";
import type { TestDraft, Visit } from "./test-draft";
import { overtimeAt } from "./test-state";
import { getVariant, minutesOf } from "./variants";

export interface TestInput {
  id: string;
  variantId: string;
  timed: boolean;
  startedAt: number;
  draft: TestDraft;
}

export interface UnfinishedTest {
  id: string;
  variantId: string;
  timed: boolean;
  startedAt: number;
  updatedAt: number;
  draft: TestDraft;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function variantOf(variantId: string) {
  const variant = getVariant(variantId);
  if (!variant) throw new Error(`unknown variant ${variantId}`);
  return variant;
}

const upsert = (
  executor: Pick<typeof db, "insert">,
  profileId: string,
  { id, variantId, timed, startedAt, draft }: TestInput,
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
      timed,
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
    const start = Math.min(Math.max(visit.startedAt, startedAt), now);
    const end = Math.min(Math.max(visit.endedAt, start), now);
    return [{ ...visit, taskId, start, end }];
  });
}

async function storeAttempts(
  tx: Tx,
  profileId: string,
  testSessionId: string,
  taskIds: string[],
  sessions: ReturnType<typeof sessionsOf>,
  answers: string[][],
  now: number,
  tz: string | undefined,
) {
  const graded = gradeTest(
    taskIds.map((taskId) => ({
      taskId,
      expected: getTask(taskId)?.check.map((c) => c.expected) ?? [],
    })),
    answers,
  ).filter((g) => g.answered);
  for (const g of graded) {
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
  const now = Date.now();
  await db.transaction(async (tx) => {
    const [stored] = await upsert(tx, profileId, test, {
      draft: null,
      finishedAt: new Date(now),
    });
    if (!stored) return;
    const startedAt = stored.startedAt.getTime();
    await tx
      .update(testSessions)
      .set({
        overtime: overtimeAt(
          { startedAt, timed: test.timed, minutes: minutesOf(variant) },
          now,
        ),
      })
      .where(eq(testSessions.id, test.id));
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
    await storeAttempts(
      tx,
      profileId,
      test.id,
      stored.taskIds,
      sessions,
      test.draft.answers,
      now,
      tz,
    );
  });
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
      timed: row.timed,
      startedAt: row.startedAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
      draft: row.draft,
    };
  },
);
