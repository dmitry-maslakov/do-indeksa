"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { reportKinds } from "@/db/columns";
import { maxParts } from "@/features/catalog/parts";
import { taskFacts, taskIdSchema } from "@/features/catalog/tasks";
import {
  factsAt,
  keepSession,
} from "@/features/practice/session/task-sessions";
import { getTaskStatuses } from "@/features/progress/progress";
import { timeZoneSchema } from "@/lib/time-zone";
import { actionClient } from "@/server/action-client";
import { track } from "@/server/analytics";
import { attemptFacts, submitAnswer } from "./answer/answers";
import {
  answerSubmitted,
  helpRevealed,
  taskIntent,
  taskOpened,
  taskReported,
  taskResumed,
  taskSkipped,
} from "./practice-events";
import { saveReport } from "./reports";
import { recordReveal, revealOwner, revealPartSchema } from "./reveal/reveals";
import { recordSkip } from "./session/skips";

function trackOpening(
  profileId: string,
  taskId: string,
  session: Awaited<ReturnType<typeof keepSession>>,
  previous?: string,
  intent?: z.output<typeof taskIntent>,
) {
  if (!session.created) return;
  if (previous && !intent)
    return track(
      taskResumed,
      {
        task_id: taskId,
        task_session_id: session.id,
        previous_task_session_id: previous,
      },
      { profileId },
    );
  return track(
    taskOpened,
    async () => ({
      ...taskFacts(taskId),
      task_session_id: session.id,
      session_kind: session.kind,
      ...(intent ?? { via: "direct" }),
      status_before:
        (await getTaskStatuses(profileId, [taskId])).get(taskId) ?? "new",
    }),
    { profileId },
  );
}

export const checkAnswer = actionClient
  .inputSchema(
    zfd.formData({
      taskId: zfd.text(taskIdSchema),
      answer: zfd.repeatable(z.array(z.string().max(500)).max(maxParts)),
      sessionId: zfd.text(z.uuid().optional()),
      clientId: zfd.text(z.uuid()),
    }),
  )
  .action(
    async ({
      parsedInput: { taskId, answer, sessionId, clientId },
      ctx: { profileId },
    }) => {
      const submitted = await submitAnswer(profileId, {
        taskId,
        answers: answer,
        sessionId,
        clientId,
      });
      if ("sitting" in submitted) return { sitting: submitted.sitting };
      const { session, attempt, outcomes, problems, correct } = submitted;
      await trackOpening(profileId, taskId, session, sessionId);
      if (attempt)
        await track(
          answerSubmitted,
          async () => ({
            ...(await attemptFacts(profileId, attempt)),
            context: "practice",
          }),
          { profileId },
        );
      refresh();
      return { outcomes, problems, correct, sessionId: session.id };
    },
  );

export const saveReveal = actionClient
  .inputSchema(
    z.object({
      taskId: taskIdSchema,
      part: revealPartSchema,
      owner: revealOwner,
    }),
  )
  .action(
    async ({ parsedInput: { taskId, part, owner }, ctx: { profileId } }) => {
      const revealed = await recordReveal(profileId, taskId, part, owner);
      if (!revealed) return;
      const { session } = revealed;
      const test = "testSessionId" in owner ? owner.testSessionId : undefined;
      const previous = "sessionId" in owner ? owner.sessionId : undefined;
      await trackOpening(profileId, taskId, session, previous);
      await track(
        helpRevealed,
        async () => ({
          ...(await factsAt(profileId, taskId, session.id, revealed.createdAt)),
          context: test ? "review" : "practice",
          part: revealed.part,
          test_session_id: test,
        }),
        { profileId },
      );
      return session.id;
    },
  );

export const keepTaskSession = actionClient
  .inputSchema(
    z.object({
      taskId: taskIdSchema,
      sessionId: z.uuid().optional(),
      tz: timeZoneSchema,
      intent: z
        .unknown()
        .transform((value) => taskIntent.safeParse(value).data)
        .optional(),
    }),
  )
  .action(
    async ({
      parsedInput: { taskId, sessionId, tz, intent },
      ctx: { profileId },
    }) => {
      const session = await keepSession(profileId, taskId, sessionId, tz);
      await trackOpening(profileId, taskId, session, sessionId, intent);
      return session.id;
    },
  );

export const saveSkip = actionClient
  .inputSchema(
    z.object({ taskId: taskIdSchema, sessionId: z.uuid().optional() }),
  )
  .action(
    async ({ parsedInput: { taskId, sessionId }, ctx: { profileId } }) => {
      const { session, createdAt } = await recordSkip(
        profileId,
        taskId,
        sessionId,
      );
      await trackOpening(profileId, taskId, session, sessionId);
      await track(
        taskSkipped,
        () => factsAt(profileId, taskId, session.id, createdAt),
        { profileId },
      );
      return session.id;
    },
  );

export const reportTask = actionClient
  .inputSchema(
    zfd.formData({
      taskId: taskIdSchema,
      kind: z.enum(reportKinds),
      message: z.string().trim().max(1000),
    }),
  )
  .action(async ({ parsedInput, ctx: { profileId } }) => {
    await saveReport(profileId, parsedInput);
    await track(
      taskReported,
      {
        ...taskFacts(parsedInput.taskId),
        kind: parsedInput.kind,
        has_message: parsedInput.message.length > 0,
        message_len: parsedInput.message.length,
      },
      { profileId },
    );
  });
