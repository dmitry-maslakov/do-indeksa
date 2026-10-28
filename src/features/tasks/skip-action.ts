"use server";

import { z } from "zod";
import { taskIdSchema } from "@/features/catalog/tasks";
import { actionClient } from "@/server/action-client";
import { recordSkip } from "./skips";

export const saveSkip = actionClient
  .inputSchema(
    z.object({ taskId: taskIdSchema, sessionId: z.uuid().optional() }),
  )
  .action(({ parsedInput: { taskId, sessionId }, ctx: { profileId } }) =>
    recordSkip(profileId, taskId, sessionId),
  );
