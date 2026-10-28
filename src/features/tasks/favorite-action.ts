"use server";

import { z } from "zod";
import { taskIdSchema } from "@/features/catalog/tasks";
import { actionClient } from "@/server/action-client";
import { setTaskFavorite } from "./favorites";

const schema = z.object({ taskId: taskIdSchema, favorite: z.boolean() });

export const setFavorite = actionClient
  .inputSchema(schema)
  .action(({ parsedInput: { taskId, favorite }, ctx: { profileId } }) =>
    setTaskFavorite(profileId, taskId, favorite),
  );
