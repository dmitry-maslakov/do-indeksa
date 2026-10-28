"use server";

import { z } from "zod";
import { taskIdSchema } from "@/features/catalog/tasks";
import { timeZoneSchema } from "@/lib/dates";
import { actionClient } from "@/server/action-client";
import { keepSession } from "./sessions";

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
