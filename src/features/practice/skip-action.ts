"use server";

import { z } from "zod";
import { taskIdSchema } from "@/features/catalog/tasks";
import { recordSkip } from "@/features/practice/session/skips";
import { actionClient } from "@/server/action-client";

export const saveSkip = actionClient
  .inputSchema(
    z.object({ taskId: taskIdSchema, sessionId: z.uuid().optional() }),
  )
  .action(({ parsedInput: { taskId, sessionId }, ctx: { profileId } }) =>
    recordSkip(profileId, taskId, sessionId),
  );
