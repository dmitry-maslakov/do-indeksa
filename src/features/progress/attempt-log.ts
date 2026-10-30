import "server-only";
import { and, eq, max } from "drizzle-orm";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { getTask } from "@/features/catalog/tasks";
import { db } from "@/server/db";
import type { FirstAttempt } from "./learning/observations";

const inFirstSession = (profileId: string) =>
  and(eq(taskSessions.profileId, profileId), eq(taskSessions.kind, "first"));

export async function getFirstAttempts(
  profileId: string,
): Promise<FirstAttempt[]> {
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

export async function getLastAnswered(profileId: string) {
  const rows = await db
    .select({
      taskId: attempts.taskId,
      at: epochMs(max(attempts.createdAt)),
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
