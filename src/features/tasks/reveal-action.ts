"use server";

import { z } from "zod";
import { taskIdSchema } from "@/features/catalog/tasks";
import { actionClient } from "@/server/action-client";
import { revealOwner } from "./reveal-owner";
import { recordReveal } from "./reveals";

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
  .action(({ parsedInput: { taskId, part, owner }, ctx: { profileId } }) =>
    recordReveal(profileId, taskId, part, owner),
  );
