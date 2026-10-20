"use server";

import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { recordReveal } from "./reveals";
import { taskIdSchema } from "./tasks";

const schema = z.object({
  taskId: taskIdSchema,
  part: z.union([
    z.enum(["answer", "solution"]),
    z.number().int().min(0).max(2),
  ]),
});

export const saveReveal = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput: { taskId, part }, ctx: { profileId } }) => {
    await recordReveal(profileId, taskId, part);
  });
