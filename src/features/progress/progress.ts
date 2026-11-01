import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { cache } from "react";
import { attempts, skips, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { examTopics } from "@/features/catalog/exams";
import { db } from "@/server/db";
import { noId } from "@/server/profile";
import { getShownTasks, getTasksWith } from "./attempt-log";
import { type TaskStat, weakest } from "./stats";
import type { Answered, TaskStatuses, Touched, TouchStatus } from "./status";
import { getLearning } from "./student-learning";
import { decisiveAttempts } from "./task-stats";
import { suggest } from "./topic-progress";

const latestAttemptsOf = async (
  profileId: string,
  taskIds?: string[],
  since = 0,
) =>
  db
    .selectDistinctOn([attempts.taskId], {
      taskId: attempts.taskId,
      correct: attempts.correct,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .where(
      and(
        await decisiveAttempts(profileId, taskIds),
        gte(attempts.createdAt, new Date(since)),
      ),
    )
    .orderBy(attempts.taskId, desc(attempts.createdAt));

const allLatestAttempts = cache(async (profileId: string) =>
  latestAttemptsOf(profileId),
);

async function getLatestAttempts(
  profileId: string,
  taskIds?: string[],
  since?: number,
) {
  if (profileId === noId) return [];
  return taskIds
    ? latestAttemptsOf(profileId, taskIds, since)
    : allLatestAttempts(profileId);
}

export async function getTaskStatuses(
  profileId: string,
  taskIds?: string[],
  since?: number,
): Promise<TaskStatuses> {
  const rows = await getLatestAttempts(profileId, taskIds, since);
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

export async function getVisitStatuses(
  profileId: string,
  taskIds: string[],
  since: number,
) {
  if (profileId === noId || !taskIds.length)
    return new Map<string, TouchStatus>();
  const [decided, shown, skipped] = await Promise.all([
    getTaskStatuses(profileId, taskIds, since),
    getShownTasks(profileId, since),
    getTasksWith(
      skips,
      profileId,
      taskIds,
      gte(skips.createdAt, new Date(since)),
    ),
  ]);
  const statusOf = (taskId: string): TouchStatus => {
    const answered = decided.get(taskId);
    if (answered) return answered;
    if (shown.has(taskId)) return "revealed";
    return skipped.has(taskId) ? "skipped" : "opened";
  };
  return new Map(taskIds.map((id) => [id, statusOf(id)]));
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
