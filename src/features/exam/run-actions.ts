"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { saveCurrentRun } from "./current-run";
import { saveFinishedRun } from "./finish-run";

const answers = z.array(z.array(z.string().max(500)).max(6)).max(10);
const durations = z.array(z.number().int().min(0)).max(10);

const runRef = z.object({
  runId: z.uuid(),
  variantId: z.string().min(1),
  startedAt: z.number().int(),
});

const finishInput = runRef.extend({ answers, durations, timed: z.boolean() });

const saveInput = runRef.extend({
  title: z.string().max(200),
  minutes: z.number().int(),
  timed: z.boolean(),
  tasks: z
    .array(z.object({ number: z.number().int(), topic: z.string().max(200) }))
    .max(10),
  updatedAt: z.number().int(),
  current: z.number().int().min(0).max(9),
  answers,
  spent: durations,
});

export const saveRun = actionClient
  .inputSchema(saveInput)
  .action(
    ({
      parsedInput: { runId, variantId, startedAt, ...run },
      ctx: { profileId },
    }) => saveCurrentRun(profileId, { runId, variantId, startedAt, run }),
  );

export const finishRun = actionClient
  .inputSchema(finishInput)
  .action(async ({ parsedInput, ctx: { profileId } }) => {
    await saveFinishedRun(profileId, parsedInput);
    refresh();
  });
