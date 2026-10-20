import "server-only";
import { and, eq, inArray, max, notExists } from "drizzle-orm";
import { attempts, taskSessions } from "@/db/schema";
import { hourMs } from "@/lib/dates";
import { db } from "@/server/db";
import type { SessionInput } from "./session-input";

type Executor = Pick<typeof db, "insert">;

export const openSessionIn = (
  executor: Executor,
  profileId: string,
  taskId: string,
  { id, startedAt }: SessionInput,
) => {
  const now = Date.now();
  return executor
    .insert(taskSessions)
    .values({
      id,
      profileId,
      taskId,
      startedAt: new Date(Math.min(Math.max(startedAt, now - hourMs), now)),
    })
    .onConflictDoNothing();
};

export async function openSession(
  profileId: string,
  taskId: string,
  session: SessionInput,
) {
  await openSessionIn(db, profileId, taskId, session);
}

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
