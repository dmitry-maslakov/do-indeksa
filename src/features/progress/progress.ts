import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { attempts, favorites } from "@/db/schema";
import { belgradeDate } from "@/lib/dates";
import { db } from "@/server/db";
import type { Attempted, Progress, TaskStatus } from "./status";

const getLatestAttempts = (userId: string, taskIds?: string[]) =>
  db
    .selectDistinctOn([attempts.taskId], {
      taskId: attempts.taskId,
      correct: attempts.correct,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        taskIds && inArray(attempts.taskId, taskIds),
      ),
    )
    .orderBy(attempts.taskId, desc(attempts.createdAt));

async function getTaskStatuses(userId: string, taskIds?: string[]) {
  const rows = await getLatestAttempts(userId, taskIds);
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

export async function getAttempted(userId: string, taskIds: string[]) {
  const today = belgradeDate();
  const rows = await getLatestAttempts(userId, taskIds);
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
