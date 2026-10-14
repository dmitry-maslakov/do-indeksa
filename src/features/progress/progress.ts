import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { attempts, favorites } from "@/db/schema";
import { idsByTopic } from "@/features/tasks/tasks";
import { db } from "@/server/db";
import type { Progress, TaskStatus } from "./status";

async function getTaskStatuses(userId: string, taskIds?: string[]) {
  const rows = await db
    .selectDistinctOn([attempts.taskId], {
      taskId: attempts.taskId,
      correct: attempts.correct,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        taskIds && inArray(attempts.taskId, taskIds),
      ),
    )
    .orderBy(attempts.taskId, desc(attempts.createdAt));
  return new Map<string, TaskStatus>(
    rows.map((row) => [row.taskId, row.correct ? "solved" : "wrong"]),
  );
}

export async function getProgress(userId: string): Promise<Progress> {
  const [statuses, starred] = await Promise.all([
    getTaskStatuses(userId),
    db
      .select({ taskId: favorites.taskId })
      .from(favorites)
      .where(eq(favorites.userId, userId)),
  ]);
  return {
    statuses,
    favorites: new Set(starred.map((f) => f.taskId)),
  };
}

export async function getTopicStatuses(
  userId: string,
  topic: string,
): Promise<Record<string, TaskStatus>> {
  const ids = idsByTopic.get(topic) ?? [];
  return Object.fromEntries(await getTaskStatuses(userId, ids));
}
