"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { reportKinds } from "@/db/columns";
import { maxParts } from "@/features/catalog/parts";
import { taskIdSchema } from "@/features/catalog/tasks";
import { keepSession } from "@/features/practice/session/task-sessions";
import { timeZoneSchema } from "@/lib/time-zone";
import { actionClient } from "@/server/action-client";
import { submitAnswer } from "./answer/answers";
import { saveReport } from "./reports";
import { recordReveal, revealOwner, revealPartSchema } from "./reveal/reveals";
import { recordSkip } from "./session/skips";

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
      const checked = await submitAnswer(profileId, {
        taskId,
        answers: answer,
        sessionId,
        clientId,
      });
      refresh();
      return checked;
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
  .action(({ parsedInput: { taskId, part, owner }, ctx: { profileId } }) =>
    recordReveal(profileId, taskId, part, owner),
  );

export const keepTaskSession = actionClient
  .inputSchema(
    z.object({
      taskId: taskIdSchema,
      sessionId: z.uuid().optional(),
      tz: timeZoneSchema,
    }),
  )
  .action(({ parsedInput: { taskId, sessionId, tz }, ctx: { profileId } }) =>
    keepSession(profileId, taskId, sessionId, tz),
  );

export const saveSkip = actionClient
  .inputSchema(
    z.object({ taskId: taskIdSchema, sessionId: z.uuid().optional() }),
  )
  .action(({ parsedInput: { taskId, sessionId }, ctx: { profileId } }) =>
    recordSkip(profileId, taskId, sessionId),
  );

export const reportTask = actionClient
  .inputSchema(
    zfd.formData({
      taskId: taskIdSchema,
      kind: z.enum(reportKinds),
      message: z.string().trim().max(1000),
    }),
  )
  .action(({ parsedInput, ctx: { profileId } }) =>
    saveReport(profileId, parsedInput),
  );
