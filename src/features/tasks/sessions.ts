import "server-only";
import { and, desc, eq, gt, inArray, max, notExists, sql } from "drizzle-orm";
import { attempts, taskSessions } from "@/db/schema";
import { db } from "@/server/db";

type Executor = Pick<typeof db, "insert" | "update" | "select">;

const alive = sql`now() - interval '45 seconds'`;

export async function liveSession(
  executor: Executor,
  profileId: string,
  taskId: string,
  sessionId?: string,
) {
  if (sessionId) {
    const [kept] = await executor
      .update(taskSessions)
      .set({ lastSeenAt: sql`now()` })
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
  const [created] = await executor
    .insert(taskSessions)
    .values({ profileId, taskId })
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
    .values({ profileId, taskId, testSessionId })
    .returning({ id: taskSessions.id });
  if (!created) throw new Error("task session was not created");
  return created.id;
}

export const keepSession = (
  profileId: string,
  taskId: string,
  sessionId?: string,
) => liveSession(db, profileId, taskId, sessionId);

export async function getSeen(profileId: string, taskIds: string[]) {
  const rows = await db
    .select({ taskId: taskSessions.taskId, at: max(taskSessions.startedAt) })
    .from(taskSessions)
    .where(
      and(
        eq(taskSessions.profileId, profileId),
        inArray(taskSessions.taskId, taskIds),
        notExists(
          db
            .select()
            .from(attempts)
            .where(eq(attempts.sessionId, taskSessions.id)),
        ),
      ),
    )
    .groupBy(taskSessions.taskId);
  return new Map(rows.flatMap((r) => (r.at ? [[r.taskId, r.at]] : [])));
}
