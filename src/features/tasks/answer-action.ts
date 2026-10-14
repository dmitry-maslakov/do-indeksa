"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { attempts } from "@/db/schema";
import { hourMs } from "@/lib/dates";
import { gradeParts } from "@/lib/math";
import { actionClient } from "@/server/action-client";
import { db } from "@/server/db";
import { getTask } from "./tasks";

const schema = zfd.formData({
  taskId: zfd.text(),
  answer: zfd.repeatable(z.array(z.string().max(500)).max(6)),
  startedAt: zfd.numeric(z.number().int().positive()),
  hintsUsed: zfd.numeric(z.number().int().min(0).max(3)),
});

export const checkAnswer = actionClient
  .inputSchema(schema)
  .stateAction(
    async ({
      parsedInput: { taskId, answer: answers, startedAt, hintsUsed },
      ctx: { userId },
    }) => {
      const task = getTask(taskId);
      if (!task) throw new Error(`unknown task ${taskId}`);

      const parts = gradeParts(
        task.check.map((c) => c.expected),
        answers,
      );
      const correct = parts.every(Boolean);

      if (userId) {
        await db.insert(attempts).values({
          userId,
          taskId,
          answers,
          parts,
          correct,
          hintsUsed,
          durationMs: Math.min(Math.max(Date.now() - startedAt, 0), hourMs),
        });
      }
      return { parts, correct };
    },
  );
