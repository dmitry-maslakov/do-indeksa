import "server-only";
import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { cache } from "react";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { examTopics } from "@/features/catalog/exams";
import { db } from "@/server/db";
import { noId } from "@/server/profile";
import { type TaskStat, weakest } from "./stats";
import type { Answered, TaskStatuses, Touched, TouchStatus } from "./status";
import { getLearning } from "./student-learning";
import { decidesStatus } from "./task-stats";
import { suggest } from "./topic-progress";

const latestAttemptsOf = (profileId: string, taskIds?: string[]) =>
  db
    .selectDistinctOn([attempts.taskId], {
      taskId: attempts.taskId,
      correct: attempts.correct,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.profileId, profileId),
        taskIds && inArray(attempts.taskId, taskIds),
        decidesStatus,
      ),
    )
    .orderBy(attempts.taskId, desc(attempts.createdAt));

const allLatestAttempts = cache(async (profileId: string) =>
  latestAttemptsOf(profileId),
);

async function getLatestAttempts(profileId: string, taskIds?: string[]) {
  if (profileId === noId) return [];
  return taskIds
    ? latestAttemptsOf(profileId, taskIds)
    : allLatestAttempts(profileId);
}

export async function getTaskStatuses(
  profileId: string,
  taskIds?: string[],
): Promise<TaskStatuses> {
  const rows = await getLatestAttempts(profileId, taskIds);
  return new Map<string, Answered>(
    rows.map((row) => [row.taskId, row.correct ? "solved" : "wrong"]),
  );
}

const touchesOf = (profileId: string, taskIds?: string[]) =>
  db
    .select({
      taskId: taskSessions.taskId,
      kind: taskSessions.kind,
      from: epochMs(taskSessions.startedAt),
      to: epochMs(taskSessions.lastSeenAt),
    })
    .from(taskSessions)
    .where(
      and(
        eq(taskSessions.profileId, profileId),
        taskIds && inArray(taskSessions.taskId, taskIds),
      ),
    )
    .orderBy(taskSessions.startedAt);

async function tasksWith(
  table: typeof reveals | typeof skips,
  profileId: string,
  taskIds?: string[],
  ...conditions: (SQL | undefined)[]
) {
  const rows = await db
    .selectDistinct({ taskId: table.taskId })
    .from(table)
    .where(
      and(
        eq(table.profileId, profileId),
        taskIds && inArray(table.taskId, taskIds),
        ...conditions,
      ),
    );
  return new Set(rows.map((row) => row.taskId));
}

export async function getTouched(
  profileId: string,
  taskIds?: string[],
): Promise<Touched> {
  if (profileId === noId) return { touches: [], statuses: new Map() };
  const [touches, statuses] = await Promise.all([
    touchesOf(profileId, taskIds),
    getTaskStatuses(profileId, taskIds),
  ]);
  return { touches, statuses };
}

export async function getTouchStatuses(
  profileId: string,
  taskIds: string[],
  { touches, statuses }: Touched,
) {
  const touched = new Set(touches.map((touch) => touch.taskId));
  const ids = taskIds.filter((id) => touched.has(id));
  if (!ids.length) return new Map<string, TouchStatus>();
  const [shown, skipped] = await Promise.all([
    tasksWith(
      reveals,
      profileId,
      ids,
      inArray(reveals.part, ["answer", "solution"]),
    ),
    tasksWith(skips, profileId, ids),
  ]);
  const statusOf = (taskId: string): TouchStatus => {
    const decided = statuses.get(taskId);
    if (decided) return decided;
    if (shown.has(taskId)) return "revealed";
    return skipped.has(taskId) ? "skipped" : "opened";
  };
  return new Map(ids.map((id) => [id, statusOf(id)]));
}

export async function getSolved(profileId: string) {
  const rows = await getLatestAttempts(profileId);
  return rows.filter((row) => row.correct);
}

export async function getTopicPlan(profileId: string) {
  const learning = await getLearning(profileId);
  const topics = [...learning.topics].map(([topic, { status }]) => ({
    topic,
    ...status,
  }));
  return { topics, suggestion: suggest(learning, Date.now()) };
}

const weakCount = 3;

export const weakTopics = (stats: TaskStat[]) =>
  weakest(stats, examTopics)
    .slice(0, weakCount)
    .map((w) => String(w.key));
