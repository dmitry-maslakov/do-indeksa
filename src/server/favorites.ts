"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getTask } from "@/content/tasks";
import { favorites } from "@/db/schema";
import { getSession } from "./auth";
import { db } from "./db";

const taskIdSchema = z.string().refine((id) => getTask(id) !== undefined);

const byUser = (userId: string, taskId: string) =>
  and(eq(favorites.userId, userId), eq(favorites.taskId, taskId));

export async function isFavorite(taskId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const [row] = await db
    .select({ taskId: favorites.taskId })
    .from(favorites)
    .where(byUser(session.user.id, taskIdSchema.parse(taskId)));
  return row !== undefined;
}

export async function setFavorite(
  taskId: string,
  favorite: boolean,
): Promise<boolean> {
  const session = await getSession();
  if (!session) throw new Error("sign in required");
  const id = taskIdSchema.parse(taskId);
  if (z.boolean().parse(favorite)) {
    await db
      .insert(favorites)
      .values({ userId: session.user.id, taskId: id })
      .onConflictDoNothing();
  } else {
    await db.delete(favorites).where(byUser(session.user.id, id));
  }
  return favorite;
}
