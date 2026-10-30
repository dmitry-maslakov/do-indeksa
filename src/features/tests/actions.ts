"use server";

import { refresh } from "next/cache";
import { attemptFacts } from "@/features/practice/answer/answers";
import { answerSubmitted } from "@/features/practice/practice-events";
import { timeZoneSchema } from "@/lib/time-zone";
import { actionClient } from "@/server/action-client";
import { track } from "@/server/analytics";
import { testFinished } from "./test-events";
import { finishTest, saveDraft, testInput } from "./test-sessions";

export const saveTest = actionClient
  .inputSchema(testInput)
  .action(({ parsedInput, ctx: { profileId } }) =>
    saveDraft(profileId, parsedInput),
  );

export const submitTest = actionClient
  .inputSchema(testInput.extend({ tz: timeZoneSchema }))
  .action(async ({ parsedInput: { tz, ...test }, ctx: { profileId } }) => {
    const finished = await finishTest(profileId, test, tz);
    if (finished) {
      await track(testFinished, finished.facts, { profileId });
      for (const { attempt, ...facts } of finished.attempted)
        await track(
          answerSubmitted,
          async () => ({
            ...(await attemptFacts(profileId, attempt)),
            ...facts,
            context: "test",
            test_session_id: test.id,
            variant_kind: finished.facts.variant_kind,
          }),
          { profileId },
        );
    }
    refresh();
  });
