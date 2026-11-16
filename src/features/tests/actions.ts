"use server";

import { refresh } from "next/cache";
import { examPathSchema, inExam } from "@/features/catalog/exams";
import { taskFacts } from "@/features/catalog/tasks";
import { attemptFacts, gradedFacts } from "@/features/practice/answer/answers";
import {
  answerSaved,
  answerSubmitted,
} from "@/features/practice/practice-events";
import { redirect } from "@/i18n/navigation";
import { localeSchema } from "@/lib/page-query";
import { timeZoneSchema } from "@/lib/time-zone";
import { actionClient } from "@/server/action-client";
import { track } from "@/server/analytics";
import { reviewHref } from "./review";
import { testFinished } from "./test-events";
import { finishTest, saveDraft, testInput } from "./test-sessions";

export const saveTest = actionClient
  .inputSchema(testInput.extend({ exam: examPathSchema }))
  .action(async ({ parsedInput: { exam, ...test }, ctx: { profileId } }) => {
    const { kind, answered } = await saveDraft(profileId, exam, test);
    for (const { taskId, position, answers } of answered)
      await track(
        answerSaved,
        async () => ({
          ...taskFacts(exam, taskId),
          ...gradedFacts(taskId, answers),
          test_session_id: test.id,
          position,
          variant_kind: kind,
        }),
        { profileId },
      );
  });

export const submitTest = actionClient
  .inputSchema(
    testInput.extend({
      tz: timeZoneSchema,
      locale: localeSchema,
      exam: examPathSchema,
    }),
  )
  .action(
    async ({
      parsedInput: { tz, locale, exam: examId, ...test },
      ctx: { profileId },
    }) => {
      const finished = await finishTest(profileId, examId, test, tz);
      if (finished) {
        await track(testFinished, finished.facts, { profileId });
        for (const { attempt, ...facts } of finished.attempted)
          await track(
            answerSubmitted,
            async () => ({
              ...(await attemptFacts(profileId, examId, attempt)),
              ...facts,
              context: "test",
              test_session_id: test.id,
              variant_kind: finished.facts.variant_kind,
            }),
            { profileId },
          );
      }
      refresh();
      redirect({ href: inExam(examId, reviewHref(test.id)), locale });
    },
  );
