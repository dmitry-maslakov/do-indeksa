import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
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

async function kindFor(executor: Executor, profileId: string, taskId: string) {
  const answered = await lastEvent(executor, attempts, profileId, taskId);
  const revealed = await lastEvent(executor, reveals, profileId, taskId);
  const skipped = await lastEvent(executor, skips, profileId, taskId);
  const [last] = [answered, revealed, skipped]
    .filter((e) => e !== undefined)
    .sort((a, b) => b.at.getTime() - a.at.getTime());
  return practiceKind(last, Boolean(answered || revealed));
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
      .returning({ id: taskSessions.id });
    if (kept) return kept.id;
  }
  const kind = await kindFor(executor, profileId, taskId);
  const [created] = await executor
    .insert(taskSessions)
    .values({ profileId, taskId, kind, tz })
    .returning({ id: taskSessions.id });
  if (!created) throw new Error("task session was not created");
  return created.id;
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
