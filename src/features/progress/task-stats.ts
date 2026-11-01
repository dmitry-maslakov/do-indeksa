import "server-only";
import {
  and,
  count,
  eq,
  gte,
  inArray,
  max,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { attempts, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { numberOf } from "@/features/catalog/exams";
import { getTask } from "@/features/catalog/tasks";
import { dayMs } from "@/lib/dates";
import { db } from "@/server/db";
import { getAfterShown } from "./sitting";
import { accuracyDays, type TaskStat } from "./stats";

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
      lastAt: epochMs(max(attempts.createdAt)),
    })
    .from(attempts)
    .where(await decisiveAttempts(profileId))
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
