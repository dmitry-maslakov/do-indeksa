"use server";

import { refresh } from "next/cache";
import { timeZoneSchema } from "@/lib/time-zone";
import { actionClient } from "@/server/action-client";
import { finishTest, saveDraft, testInput } from "./sessions";

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
