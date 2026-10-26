"use server";

import { z } from "zod";
import { timeZoneSchema } from "@/lib/dates";
import { actionClient } from "@/server/action-client";
import { keepSession } from "./sessions";
import { taskIdSchema } from "./tasks";

export const keepTaskSession = actionClient
  .inputSchema(
    z.object({
      taskId: taskIdSchema,
      sessionId: z.uuid().optional(),
      tz: timeZoneSchema,
    }),
  )
  .action(({ parsedInput: { taskId, sessionId, tz }, ctx: { profileId } }) =>
    keepSession(profileId, taskId, sessionId, tz),
  );
