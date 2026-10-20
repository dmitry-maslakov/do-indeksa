"use server";

import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { revealOwner } from "./reveal-owner";
import { recordReveal } from "./reveals";
import { taskIdSchema } from "./tasks";

const schema = z.object({
  taskId: taskIdSchema,
  part: z.union([
    z.enum(["answer", "solution"]),
    z.number().int().min(0).max(2),
  ]),
  owner: revealOwner,
});

export const saveReveal = actionClient
  .inputSchema(schema)
  .action(
    async ({ parsedInput: { taskId, part, owner }, ctx: { profileId } }) => {
      await recordReveal(profileId, taskId, part, owner);
    },
  );
