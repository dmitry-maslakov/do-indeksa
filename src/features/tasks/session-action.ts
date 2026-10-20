"use server";

import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { keepSession } from "./sessions";
import { taskIdSchema } from "./tasks";

export const keepTaskSession = actionClient
  .inputSchema(
    z.object({ taskId: taskIdSchema, sessionId: z.uuid().optional() }),
  )
  .action(({ parsedInput: { taskId, sessionId }, ctx: { profileId } }) =>
    keepSession(profileId, taskId, sessionId),
  );
