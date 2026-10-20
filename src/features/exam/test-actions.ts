"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { actionClient } from "@/server/action-client";
import { testDraft } from "./test-draft";
import { finishTest, saveDraft } from "./test-sessions";

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
  .inputSchema(testInput)
  .action(async ({ parsedInput, ctx: { profileId } }) => {
    await finishTest(profileId, parsedInput);
    refresh();
  });
