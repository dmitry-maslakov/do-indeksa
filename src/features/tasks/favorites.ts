import "server-only";
import { and, eq } from "drizzle-orm";
import { favorites } from "@/db/schema";
import { db } from "@/server/db";

const byUser = (userId: string, taskId: string) =>
  and(eq(favorites.userId, userId), eq(favorites.taskId, taskId));

export async function isFavorite(userId: string, taskId: string) {
  const [row] = await db
    .select({ taskId: favorites.taskId })
    .from(favorites)
    .where(byUser(userId, taskId))
    .limit(1);
  return row !== undefined;
}

export async function setTaskFavorite(
  userId: string,
  taskId: string,
  favorite: boolean,
) {
  if (favorite) {
    await db.insert(favorites).values({ userId, taskId }).onConflictDoNothing();
  } else {
    await db.delete(favorites).where(byUser(userId, taskId));
  }
  return favorite;
}
