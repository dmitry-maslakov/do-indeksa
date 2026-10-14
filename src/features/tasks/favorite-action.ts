"use server";

import { z } from "zod";
import { favorites } from "@/db/schema";
import { authActionClient } from "@/server/action-client";
import { db } from "@/server/db";
import { byUser } from "./favorites";
import { taskIdSchema } from "./tasks";

const schema = z.object({ taskId: taskIdSchema, favorite: z.boolean() });

export const setFavorite = authActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput: { taskId, favorite }, ctx: { userId } }) => {
    if (favorite) {
      await db
        .insert(favorites)
        .values({ userId, taskId })
        .onConflictDoNothing();
    } else {
      await db.delete(favorites).where(byUser(userId, taskId));
    }
    return favorite;
  });
