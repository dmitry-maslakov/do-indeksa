import "server-only";
import { attempts } from "@/db/schema";
import { hourMs } from "@/lib/dates";
import { gradeParts } from "@/lib/math";
import { isRight } from "@/lib/part-outcome";
import { db } from "@/server/db";
import { getTask } from "./tasks";

interface Answer {
  taskId: string;
  answers: string[];
  startedAt: number;
  hintsUsed: number;
}

export async function submitAnswer(
  userId: string | undefined,
  { taskId, answers, startedAt, hintsUsed }: Answer,
) {
  const task = getTask(taskId);
  if (!task) throw new Error(`unknown task ${taskId}`);

  const outcomes = gradeParts(
    task.check.map((c) => c.expected),
    answers,
  );
  const correct = outcomes.every(isRight);

  if (userId) {
    await db.insert(attempts).values({
      userId,
      taskId,
      answers,
      outcomes,
      correct,
      hintsUsed,
      durationMs: Math.min(Math.max(Date.now() - startedAt, 0), hourMs),
    });
  }
  return { outcomes, correct };
}
