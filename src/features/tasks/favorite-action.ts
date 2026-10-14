"use server";

import { z } from "zod";
import { favorites } from "@/db/schema";
import { getSession } from "@/server/auth";
import { db } from "@/server/db";
import { byUser } from "./favorites";
import { getTask } from "./tasks";

const taskIdSchema = z.string().refine((id) => getTask(id) !== undefined);

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
