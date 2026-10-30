import "server-only";
import { and, desc, eq, inArray, max } from "drizzle-orm";
import { attempts, taskSessions } from "@/db/schema";
import { examTopics } from "@/features/catalog/exams";
import { idsByTopic } from "@/features/catalog/tasks";
import { belgradeDate } from "@/lib/dates";
import { db } from "@/server/db";
import { type TaskStat, weakest } from "./stats";
import type { TaskStatus, TaskStatuses, Touched } from "./status";
import { getLearning } from "./student-learning";
import { decidesStatus, getLatestResults } from "./task-stats";
import { lastPracticed, suggest } from "./topic-progress";

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

export async function getTaskStatuses(
  profileId: string,
  taskIds?: string[],
): Promise<TaskStatuses> {
  const rows = await getLatestAttempts(profileId, taskIds);
  return new Map<string, TaskStatus>(
    rows.map((row) => [row.taskId, row.correct ? "solved" : "wrong"]),
  );
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

export async function getSolved(profileId: string) {
  const rows = await getLatestAttempts(profileId);
  return rows.filter((row) => row.correct);
}

export async function getTopicPlan(profileId: string) {
  const learning = await getLearning(profileId);
  const topics = [...learning].map(([topic, { status }]) => ({
    topic,
    ...status,
  }));
  const last = lastPracticed(topics);
  const latest = last
    ? await getLatestResults(profileId, idsByTopic.get(last.topic) ?? [], 3)
    : [];
  return { topics, suggestion: suggest(topics, latest) };
}

const weakCount = 3;

export const weakTopics = (stats: TaskStat[]) =>
  weakest(stats, examTopics)
    .slice(0, weakCount)
    .map((w) => String(w.key));
