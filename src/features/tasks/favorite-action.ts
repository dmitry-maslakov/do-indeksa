"use server";

import { z } from "zod";
import { authActionClient } from "@/server/action-client";
import { setTaskFavorite } from "./favorites";
import { taskIdSchema } from "./tasks";

const schema = z.object({ taskId: taskIdSchema, favorite: z.boolean() });

export const setFavorite = authActionClient
  .inputSchema(schema)
  .action(({ parsedInput: { taskId, favorite }, ctx: { userId } }) =>
    setTaskFavorite(userId, taskId, favorite),
  );
