"use server";

import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { sessionInput } from "./session-input";
import { openSession } from "./sessions";
import { taskIdSchema } from "./tasks";

export const openTaskSession = actionClient
  .inputSchema(z.object({ taskId: taskIdSchema, session: sessionInput }))
  .action(async ({ parsedInput: { taskId, session }, ctx: { profileId } }) => {
    await openSession(profileId, taskId, session);
  });
