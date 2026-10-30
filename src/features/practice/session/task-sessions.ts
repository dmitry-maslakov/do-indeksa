import "server-only";
import { and, desc, eq, gt, inArray, lt, type SQL, sql } from "drizzle-orm";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
import { taskFacts } from "@/features/catalog/tasks";
import { verdictOf } from "@/features/practice/answer/verdicts";
import { db } from "@/server/db";
import { attemptGapMs, practiceKind, sessionLiveMs } from "./session-kind";

type Executor = Pick<typeof db, "insert" | "update" | "select">;

async function lastEvent(
  executor: Executor,
  table: typeof attempts | typeof reveals | typeof skips,
  profileId: string,
  taskId: string,
) {
  const [last] = await executor
    .select({
      at: table.createdAt,
      kind: taskSessions.kind,
      recent: sql<boolean>`${table.createdAt} > now() - ${attemptGapMs} * interval '1 millisecond'`,
    })
    .from(table)
    .innerJoin(taskSessions, eq(taskSessions.id, table.sessionId))
    .where(and(eq(table.profileId, profileId), eq(table.taskId, taskId)))
    .orderBy(desc(table.createdAt))
    .limit(1);
  return last;
}

const decidingAnswer = sql`${attempts.outcomes} && array['right', 'wrong']::part_outcome[]`;

async function hasWorked(
  executor: Executor,
  profileId: string,
  taskId: string,
) {
  const [answered] = await executor
    .select({ id: attempts.id })
    .from(attempts)
    .where(
      and(
        eq(attempts.profileId, profileId),
        eq(attempts.taskId, taskId),
        decidingAnswer,
      ),
    )
    .limit(1);
  if (answered) return true;
  const [shown] = await executor
    .select({ id: reveals.id })
    .from(reveals)
    .where(
      and(
        eq(reveals.profileId, profileId),
        eq(reveals.taskId, taskId),
        inArray(reveals.part, ["answer", "solution"]),
      ),
    )
    .limit(1);
  return Boolean(shown);
}

async function kindFor(executor: Executor, profileId: string, taskId: string) {
  const answered = await lastEvent(executor, attempts, profileId, taskId);
  const revealed = await lastEvent(executor, reveals, profileId, taskId);
  const skipped = await lastEvent(executor, skips, profileId, taskId);
  const [last] = [answered, revealed, skipped]
    .filter((e) => e !== undefined)
    .sort((a, b) => b.at.getTime() - a.at.getTime());
  return practiceKind(last, await hasWorked(executor, profileId, taskId));
}

const alive = sql`now() - ${sessionLiveMs} * interval '1 millisecond'`;

export async function liveSession(
  executor: Executor,
  profileId: string,
  taskId: string,
  sessionId: string | undefined,
  tz?: string,
) {
  if (sessionId) {
    const [kept] = await executor
      .update(taskSessions)
      .set({
        lastSeenAt: sql`now()`,
        ...(tz && { tz: sql`coalesce(${taskSessions.tz}, ${tz})` }),
      })
      .where(
        and(
          eq(taskSessions.id, sessionId),
          eq(taskSessions.profileId, profileId),
          eq(taskSessions.taskId, taskId),
          gt(taskSessions.lastSeenAt, alive),
        ),
      )
      .returning({ id: taskSessions.id, kind: taskSessions.kind });
    if (kept) return { ...kept, created: false };
  }
  const kind = await kindFor(executor, profileId, taskId);
  const [created] = await executor
    .insert(taskSessions)
    .values({ profileId, taskId, kind, tz })
    .returning({ id: taskSessions.id, kind: taskSessions.kind });
  if (!created) throw new Error("task session was not created");
  return { ...created, created: true };
}

export async function testTaskSession(
  executor: Executor,
  profileId: string,
  taskId: string,
  testSessionId: string,
) {
  const [found] = await executor
    .select({ id: taskSessions.id })
    .from(taskSessions)
    .where(
      and(
        eq(taskSessions.profileId, profileId),
        eq(taskSessions.taskId, taskId),
        eq(taskSessions.testSessionId, testSessionId),
      ),
    )
    .orderBy(desc(taskSessions.startedAt))
    .limit(1);
  if (found) return found.id;
  const [created] = await executor
    .insert(taskSessions)
    .values({ profileId, taskId, testSessionId, kind: "mock" })
    .returning({ id: taskSessions.id });
  if (!created) throw new Error("task session was not created");
  return created.id;
}

export const keepSession = (
  profileId: string,
  taskId: string,
  sessionId: string | undefined,
  tz: string | undefined,
) => liveSession(db, profileId, taskId, sessionId, tz);

async function sessionFacts(profileId: string, sessionId: string, at: Date) {
  const before = (table: typeof attempts | typeof reveals, ...where: SQL[]) =>
    and(eq(table.sessionId, sessionId), lt(table.createdAt, at), ...where);
  const revealed = (...parts: (typeof reveals.$inferSelect.part)[]) =>
    db.$count(reveals, before(reveals, inArray(reveals.part, parts)));
  const last = db
    .select({ outcomes: attempts.outcomes })
    .from(attempts)
    .where(before(attempts))
    .orderBy(desc(attempts.createdAt))
    .limit(1);
  const [facts] = await db
    .select({
      kind: taskSessions.kind,
      startedAt: taskSessions.startedAt,
      attempts: db.$count(attempts, before(attempts)),
      outcomes: sql`(${last})`.mapWith(attempts.outcomes),
      hints: revealed("hint1", "hint2", "hint3"),
      solution: revealed("solution"),
      answer: revealed("answer"),
    })
    .from(taskSessions)
    .where(
      and(
        eq(taskSessions.id, sessionId),
        eq(taskSessions.profileId, profileId),
      ),
    );
  if (!facts) throw new Error(`unknown task session ${sessionId}`);
  return {
    task_session_id: sessionId,
    session_kind: facts.kind,
    attempts_before: facts.attempts,
    last_verdict: facts.outcomes
      ? verdictOf(facts.outcomes)
      : ("none" as const),
    hints_before: facts.hints,
    solution_before: facts.solution > 0,
    answer_before: facts.answer > 0,
    since_open_ms: Math.max(0, at.getTime() - facts.startedAt.getTime()),
  };
}

export const factsAt = async (
  profileId: string,
  taskId: string,
  sessionId: string,
  at: Date,
) => ({
  ...taskFacts(taskId),
  ...(await sessionFacts(profileId, sessionId, at)),
});
