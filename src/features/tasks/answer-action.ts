"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { taskIdSchema } from "@/features/catalog/tasks";
import { actionClient } from "@/server/action-client";
import { submitAnswer } from "./answers";

const schema = zfd.formData({
  taskId: zfd.text(taskIdSchema),
  answer: zfd.repeatable(z.array(z.string().max(500)).max(6)),
  sessionId: zfd.text(z.uuid().optional()),
  clientId: zfd.text(z.uuid()),
});

export const checkAnswer = actionClient
  .inputSchema(schema)
  .action(
    ({
      parsedInput: { taskId, answer, sessionId, clientId },
      ctx: { profileId },
    }) =>
      submitAnswer(profileId, {
        taskId,
        answers: answer,
        sessionId,
        clientId,
      }),
  );
