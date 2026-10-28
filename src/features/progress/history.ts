import "server-only";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { attempts, taskSessions } from "@/db/schema";
import { numberOf } from "@/features/catalog/exams";
import { getTask } from "@/features/catalog/tasks";
import { dayMs } from "@/lib/dates";
import { db } from "@/server/db";
import { accuracyDays, type TaskStat } from "./stats";

export const decidesStatus = or(
  eq(attempts.correct, true),
  sql`'wrong' = any(${attempts.outcomes})`,
);

type TaskTotals = Omit<TaskStat, "number" | "topic">;

function taskStats(rows: TaskTotals[]): TaskStat[] {
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task
      ? { ...row, topic: task.topic, number: numberOf(task.topic) }
      : [];
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
  const right = eq(attempts.correct, true);
  const rows = await db
    .select({
      taskId: attempts.taskId,
      attempts: count(),
      right: countWhere(right),
      recentAttempts: countWhere(recent),
      recentRight: countWhere(sql`${recent} and ${right}`),
      firstRight: sql<boolean>`(array_agg(${attempts.correct} order by ${attempts.createdAt}))[1]`,
      latestRight: sql<boolean>`(array_agg(${attempts.correct} order by ${attempts.createdAt} desc))[1]`,
      lastAt:
        sql`extract(epoch from max(${attempts.createdAt})) * 1000`.mapWith(
          Number,
        ),
    })
    .from(attempts)
    .where(and(eq(attempts.profileId, profileId), decidesStatus))
    .groupBy(attempts.taskId);
  return taskStats(rows);
}

export async function getTaskTimes(profileId: string) {
  const rows = await db
    .select({
      taskId: taskSessions.taskId,
      ms: sql<number>`sum(${sessionMs})`.mapWith(Number),
    })
    .from(taskSessions)
    .where(eq(taskSessions.profileId, profileId))
    .groupBy(taskSessions.taskId);
  return new Map(rows.map((r) => [r.taskId, r.ms]));
}

export const getLatestResults = async (
  profileId: string,
  taskIds: string[],
  limit: number,
) =>
  (
    await db
      .select({ correct: attempts.correct })
      .from(attempts)
      .where(
        and(
          eq(attempts.profileId, profileId),
          inArray(attempts.taskId, taskIds),
          decidesStatus,
        ),
      )
      .orderBy(desc(attempts.createdAt))
      .limit(limit)
  ).map((row) => row.correct);
