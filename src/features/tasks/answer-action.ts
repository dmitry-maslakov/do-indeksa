"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClient } from "@/server/action-client";
import { submitAnswer } from "./answers";

const schema = zfd.formData({
  taskId: zfd.text(),
  answer: zfd.repeatable(z.array(z.string().max(500)).max(6)),
  startedAt: zfd.numeric(z.number().int().positive()),
  hintsUsed: zfd.numeric(z.number().int().min(0).max(3)),
});

export const checkAnswer = actionClient
  .inputSchema(schema)
  .action(({ parsedInput: { answer, ...input }, ctx: { profileId } }) =>
    submitAnswer(profileId, { ...input, answers: answer }),
  );
