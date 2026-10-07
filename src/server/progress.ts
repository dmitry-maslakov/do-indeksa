import "server-only";
import { desc, eq } from "drizzle-orm";
import { attempts, favorites } from "@/db/schema";
import { latestStatuses, type Progress } from "@/lib/progress";
import { db } from "./db";

export async function getProgress(userId: string): Promise<Progress> {
  const [results, starred] = await Promise.all([
    db
      .select({ taskId: attempts.taskId, correct: attempts.correct })
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.createdAt)),
    db
      .select({ taskId: favorites.taskId })
      .from(favorites)
      .where(eq(favorites.userId, userId)),
  ]);
  return {
    statuses: latestStatuses(results),
    favorites: new Set(starred.map((f) => f.taskId)),
  };
}
