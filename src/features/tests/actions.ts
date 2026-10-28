"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { testDraft } from "@/db/columns";
import { timeZoneSchema } from "@/lib/dates";
import { actionClient } from "@/server/action-client";
import { finishTest, saveDraft } from "./sessions";

const testInput = z.object({
  id: z.uuid(),
  variantId: z.string().min(1),
  timed: z.boolean(),
  startedAt: z.number().int(),
  draft: testDraft,
});

export const saveTest = actionClient
  .inputSchema(testInput)
  .action(({ parsedInput, ctx: { profileId } }) =>
    saveDraft(profileId, parsedInput),
  );

export const submitTest = actionClient
  .inputSchema(testInput.extend({ tz: timeZoneSchema }))
  .action(async ({ parsedInput: { tz, ...test }, ctx: { profileId } }) => {
    await finishTest(profileId, test, tz);
    refresh();
  });
