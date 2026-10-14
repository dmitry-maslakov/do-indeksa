import "server-only";
import { and, eq } from "drizzle-orm";
import { favorites } from "@/db/schema";
import { db } from "@/server/db";

export const byUser = (userId: string, taskId: string) =>
  and(eq(favorites.userId, userId), eq(favorites.taskId, taskId));

export async function isFavorite(userId: string, taskId: string) {
  const [row] = await db
    .select({ taskId: favorites.taskId })
    .from(favorites)
    .where(byUser(userId, taskId))
    .limit(1);
  return row !== undefined;
}
