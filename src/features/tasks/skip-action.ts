"use server";

import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { recordSkip } from "./skips";
import { taskIdSchema } from "./tasks";

export const saveSkip = actionClient
  .inputSchema(
    z.object({ taskId: taskIdSchema, sessionId: z.uuid().optional() }),
  )
  .action(({ parsedInput: { taskId, sessionId }, ctx: { profileId } }) =>
    recordSkip(profileId, taskId, sessionId),
  );
