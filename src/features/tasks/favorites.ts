import "server-only";
import { and, eq } from "drizzle-orm";
import { favorites } from "@/db/schema";
import { db } from "@/server/db";

const byProfile = (profileId: string, taskId: string) =>
  and(eq(favorites.profileId, profileId), eq(favorites.taskId, taskId));

export async function isFavorite(profileId: string, taskId: string) {
  const [row] = await db
    .select({ taskId: favorites.taskId })
    .from(favorites)
    .where(byProfile(profileId, taskId))
    .limit(1);
  return row !== undefined;
}

export async function setTaskFavorite(
  profileId: string,
  taskId: string,
  favorite: boolean,
) {
  if (favorite) {
    await db
      .insert(favorites)
      .values({ profileId, taskId })
      .onConflictDoNothing();
  } else {
    await db.delete(favorites).where(byProfile(profileId, taskId));
  }
  return favorite;
}
