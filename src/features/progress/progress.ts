import "server-only";
import { and, desc, eq, inArray, max } from "drizzle-orm";
import { attempts, favorites, taskSessions } from "@/db/schema";
import { positions } from "@/features/catalog/exams";
import { idsByTopic } from "@/features/catalog/tasks";
import { belgradeDate } from "@/lib/dates";
import { db } from "@/server/db";
import { type TaskStat, weakest } from "./stats";
import type { Progress, TaskStatus, Touched } from "./status";
import { decidesStatus, getLatestResults, getTaskStats } from "./task-stats";
import { lastPracticed, suggest, topicProgress } from "./topic-progress";

async function getLastSeen(profileId: string, taskIds: string[]) {
  const rows = await db
    .select({ taskId: taskSessions.taskId, at: max(taskSessions.lastSeenAt) })
    .from(taskSessions)
    .where(
      and(
        eq(taskSessions.profileId, profileId),
        inArray(taskSessions.taskId, taskIds),
      ),
    )
    .groupBy(taskSessions.taskId);
  return rows.flatMap((r) => (r.at ? [{ taskId: r.taskId, at: r.at }] : []));
}

const getLatestAttempts = (profileId: string, taskIds?: string[]) =>
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

async function getTaskStatuses(profileId: string, taskIds?: string[]) {
  const rows = await getLatestAttempts(profileId, taskIds);
  return new Map<string, TaskStatus>(
    rows.map((row) => [row.taskId, row.correct ? "solved" : "wrong"]),
  );
}

export async function getProgress(profileId: string): Promise<Progress> {
  const [statuses, starred] = await Promise.all([
    getTaskStatuses(profileId),
    db
      .select({ taskId: favorites.taskId })
      .from(favorites)
      .where(eq(favorites.profileId, profileId)),
  ]);
  return {
    statuses,
    favorites: new Set(starred.map((f) => f.taskId)),
  };
}

export async function getTouched(profileId: string, taskIds: string[]) {
  const today = belgradeDate();
  const [seen, latest] = await Promise.all([
    getLastSeen(profileId, taskIds),
    getLatestAttempts(profileId, taskIds),
  ]);
  const touched = new Map<string, Touched>();
  const touch = (taskId: string, at: Date, status?: Touched["status"]) => {
    const prev = touched.get(taskId);
    const last = prev && prev.at > at ? prev.at : at;
    touched.set(taskId, {
      status: status ?? prev?.status,
      at: last,
      today: belgradeDate(last) === today,
    });
  };
  for (const { taskId, at } of seen) touch(taskId, at);
  for (const row of latest)
    touch(row.taskId, row.createdAt, row.correct ? "solved" : "wrong");
  return touched;
}

export async function countSolved(profileId: string, except: string) {
  const rows = await getLatestAttempts(profileId);
  return rows.filter((row) => row.correct && row.taskId !== except).length;
}

const topicTotals = positions.map((p) => ({
  topic: p.topic,
  total: idsByTopic.get(p.topic)?.length ?? 0,
}));

export async function getTopicPlan(profileId: string) {
  const topics = topicProgress(
    await getTaskStats(profileId),
    topicTotals,
    Date.now(),
  );
  const last = lastPracticed(topics);
  const latest = last
    ? await getLatestResults(profileId, idsByTopic.get(last.topic) ?? [], 3)
    : [];
  return { topics, suggestion: suggest(topics, latest) };
}

const weakCount = 3;

export const weakTopics = (stats: TaskStat[]) =>
  weakest(
    stats,
    positions.map((p) => p.topic),
  )
    .slice(0, weakCount)
    .map((w) => String(w.key));
