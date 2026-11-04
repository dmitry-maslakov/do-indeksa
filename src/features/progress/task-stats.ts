import "server-only";
import {
  and,
  count,
  eq,
  gte,
  inArray,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { attempts, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { getTask } from "@/features/catalog/tasks";
import { dayMs } from "@/lib/dates";
import { db } from "@/server/db";
import { getAfterShown } from "./sitting";
import { accuracyDays, type TaskStat } from "./stats";
import type { TaskOutcome } from "./topic-mistakes";

const decidesStatus = or(
  eq(attempts.correct, true),
  sql`'wrong' = any(${attempts.outcomes})`,
);

export async function decisiveAttempts(profileId: string, taskIds?: string[]) {
  const given = (await getAfterShown(profileId))
    .filter((s) => !taskIds || taskIds.includes(s.taskId))
    .map((s) => s.id);
  return and(
    eq(attempts.profileId, profileId),
    taskIds && inArray(attempts.taskId, taskIds),
    decidesStatus,
    given.length > 0 ? notInArray(attempts.id, given) : undefined,
  );
}

function taskStats(rows: Omit<TaskStat, "topic">[]): TaskStat[] {
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task ? { ...row, topic: task.topic } : [];
  });
}

export const sessionMs = sql`extract(epoch from ${taskSessions.lastSeenAt} - ${taskSessions.startedAt}) * 1000`;

const countWhere = (condition: SQL) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export async function getTaskStats(profileId: string) {
  const recent = gte(
    attempts.createdAt,
    new Date(Date.now() - accuracyDays * dayMs),
  );
  const rows = await db
    .select({
      taskId: attempts.taskId,
      attempts: count(),
      right: countWhere(eq(attempts.correct, true)),
    })
    .from(attempts)
    .where(and(await decisiveAttempts(profileId), recent))
    .groupBy(attempts.taskId);
  return taskStats(rows);
}

export async function getPracticeSpans(profileId: string, since: Date) {
  return db
    .select({
      at: epochMs(taskSessions.startedAt),
      tz: taskSessions.tz,
      ms: sql<number>`${sessionMs}`.mapWith(Number),
    })
    .from(taskSessions)
    .where(
      and(
        eq(taskSessions.profileId, profileId),
        gte(taskSessions.startedAt, since),
      ),
    );
}

export async function getTaskOutcomes(
  profileId: string,
  since: Date,
): Promise<TaskOutcome[]> {
  const [rows, times] = await Promise.all([
    db
      .select({
        taskId: attempts.taskId,
        wrong: sql<boolean>`bool_or(not ${attempts.correct})`,
      })
      .from(attempts)
      .where(
        and(await decisiveAttempts(profileId), gte(attempts.createdAt, since)),
      )
      .groupBy(attempts.taskId),
    db
      .select({
        taskId: taskSessions.taskId,
        ms: sql<number>`sum(${sessionMs})`.mapWith(Number),
      })
      .from(taskSessions)
      .where(
        and(
          eq(taskSessions.profileId, profileId),
          gte(taskSessions.startedAt, since),
        ),
      )
      .groupBy(taskSessions.taskId),
  ]);
  const ms = new Map(times.map((t) => [t.taskId, t.ms]));
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task
      ? { ...row, topic: task.topic, ms: ms.get(row.taskId) ?? 0 }
      : [];
  });
}
