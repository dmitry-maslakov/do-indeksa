import "server-only";
import { and, desc, eq, inArray, max, type SQLWrapper, sql } from "drizzle-orm";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
import { positions } from "@/features/catalog/exams";
import { getTask, idsByTopic } from "@/features/catalog/tasks";
import { belgradeDate } from "@/lib/dates";
import { db } from "@/server/db";
import { type FirstAttempt, observe } from "./observations";
import { type TaskStat, weakest } from "./stats";
import type { TaskStatus, TaskStatuses, Touched } from "./status";
import { decidesStatus, getLatestResults } from "./task-stats";
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

const epochMs = (column: SQLWrapper) =>
  sql<number>`extract(epoch from ${column}) * 1000`.mapWith(Number);

const inFirstSession = (profileId: string) =>
  and(eq(taskSessions.profileId, profileId), eq(taskSessions.kind, "first"));

async function getFirstAttempts(profileId: string): Promise<FirstAttempt[]> {
  const [submits, opened, skipped] = await Promise.all([
    db
      .select({
        taskId: attempts.taskId,
        at: epochMs(attempts.createdAt),
        outcomes: attempts.outcomes,
        correct: attempts.correct,
        difficulty: attempts.difficulty,
        keyRev: attempts.keyRev,
        tz: taskSessions.tz,
      })
      .from(attempts)
      .innerJoin(taskSessions, eq(taskSessions.id, attempts.sessionId))
      .where(inFirstSession(profileId)),
    db
      .select({
        taskId: reveals.taskId,
        at: epochMs(reveals.createdAt),
        part: reveals.part,
      })
      .from(reveals)
      .innerJoin(taskSessions, eq(taskSessions.id, reveals.sessionId))
      .where(inFirstSession(profileId)),
    db
      .select({ taskId: skips.taskId, at: epochMs(skips.createdAt) })
      .from(skips)
      .innerJoin(taskSessions, eq(taskSessions.id, skips.sessionId))
      .where(inFirstSession(profileId)),
  ]);
  const submitsOf = Map.groupBy(submits, (s) => s.taskId);
  const revealsOf = Map.groupBy(opened, (r) => r.taskId);
  const skipsOf = Map.groupBy(skipped, (s) => s.taskId);
  return [...submitsOf].flatMap(([taskId, mine]) => {
    const task = getTask(taskId);
    if (!task) return [];
    return {
      taskId,
      topic: task.topic,
      keyRev: task.keyRev,
      tz: mine.find((s) => s.tz)?.tz ?? null,
      submits: mine,
      reveals: revealsOf.get(taskId) ?? [],
      skips: skipsOf.get(taskId)?.map((s) => s.at) ?? [],
    };
  });
}

async function getLastAnswered(profileId: string) {
  const rows = await db
    .select({
      taskId: attempts.taskId,
      at: epochMs(sql`max(${attempts.createdAt})`),
    })
    .from(attempts)
    .where(eq(attempts.profileId, profileId))
    .groupBy(attempts.taskId);
  const byTopic = new Map<string, number>();
  for (const { taskId, at } of rows) {
    const topic = getTask(taskId)?.topic;
    if (topic && at !== null)
      byTopic.set(topic, Math.max(at, byTopic.get(topic) ?? at));
  }
  return byTopic;
}

const examTopics = positions.map((p) => p.topic);

export async function getTopicPlan(profileId: string) {
  const now = Date.now();
  const [firstAttempts, lastAnswered] = await Promise.all([
    getFirstAttempts(profileId),
    getLastAnswered(profileId),
  ]);
  const observations = firstAttempts.flatMap(
    (attempt) => observe(attempt, now) ?? [],
  );
  const topics = topicProgress(observations, lastAnswered, examTopics, now);
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
