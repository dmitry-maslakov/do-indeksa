import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { attempts, favorites } from "@/db/schema";
import { positions } from "@/features/exam/exam";
import { idsByTopic } from "@/features/tasks/tasks";
import { belgradeDate } from "@/lib/dates";
import { db } from "@/server/db";
import { decidesStatus } from "./decides-status";
import { getLatestResults, getTaskStats } from "./history";
import { type TaskStat, weakest } from "./stats";
import type { Attempted, Progress, TaskStatus } from "./status";
import { lastPracticed, suggest, topicProgress } from "./topic-progress";

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

export async function getAttempted(profileId: string, taskIds: string[]) {
  const today = belgradeDate();
  const rows = await getLatestAttempts(profileId, taskIds);
  return new Map<string, Attempted>(
    rows.map((row) => [
      row.taskId,
      {
        status: row.correct ? "solved" : "wrong",
        at: row.createdAt,
        today: belgradeDate(row.createdAt) === today,
      },
    ]),
  );
}

const topicTotals = positions.map((p) => ({
  topic: p.topic,
  total: idsByTopic.get(p.topic)?.length ?? 0,
}));

export async function getTopicPlan(profileId?: string) {
  const topics = topicProgress(
    profileId ? await getTaskStats(profileId) : [],
    topicTotals,
    Date.now(),
  );
  const last = lastPracticed(topics);
  const latest =
    profileId && last
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
