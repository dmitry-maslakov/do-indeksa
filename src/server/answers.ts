"use server";

import { z } from "zod";
import { getTask } from "@/content/tasks";
import { attempts } from "@/db/schema";
import { isEquivalent } from "@/lib/math";
import { getSession } from "./auth";
import { db } from "./db";

export interface CheckResult {
  parts: boolean[];
  correct: boolean;
}

const input = z.object({
  taskId: z.string().min(1),
  answers: z.array(z.string().max(500)).max(6),
  startedAt: z.coerce.number().int().positive(),
  hintsUsed: z.coerce.number().int().min(0).max(3),
});

const HOUR = 60 * 60 * 1000;

export async function checkAnswer(
  _previous: CheckResult | null,
  form: FormData,
): Promise<CheckResult> {
  const { taskId, answers, startedAt, hintsUsed } = input.parse({
    taskId: form.get("taskId"),
    answers: form.getAll("answer"),
    startedAt: form.get("startedAt"),
    hintsUsed: form.get("hintsUsed") ?? 0,
  });
  const task = getTask(taskId);
  if (!task) throw new Error(`unknown task ${taskId}`);

  const parts = task.check.map((c, i) =>
    isEquivalent(answers[i] ?? "", c.expected),
  );
  const correct = parts.every(Boolean);

  const session = await getSession();
  if (session) {
    await db.insert(attempts).values({
      userId: session.user.id,
      taskId,
      answers,
      parts,
      correct,
      hintsUsed,
      durationMs: Math.min(Math.max(Date.now() - startedAt, 0), HOUR),
    });
  }
  return { parts, correct };
}
