import "server-only";
import { attempts } from "@/db/schema";
import { hourMs } from "@/lib/dates";
import { gradeParts } from "@/lib/math";
import { isRight } from "@/lib/part-outcome";
import { db } from "@/server/db";
import type { SessionInput } from "./session-input";
import { openSessionIn } from "./sessions";
import { getTask } from "./tasks";

interface Answer {
  taskId: string;
  answers: string[];
  session: SessionInput;
}

export async function submitAnswer(
  profileId: string,
  { taskId, answers, session }: Answer,
) {
  const task = getTask(taskId);
  if (!task) throw new Error(`unknown task ${taskId}`);

  const outcomes = gradeParts(
    task.check.map((c) => c.expected),
    answers,
  );
  const correct = outcomes.every(isRight);

  const now = Date.now();
  await db.transaction(async (tx) => {
    await openSessionIn(tx, profileId, taskId, session);
    await tx.insert(attempts).values({
      profileId,
      taskId,
      sessionId: session.id,
      answers,
      outcomes,
      correct,
      durationMs: Math.min(Math.max(now - session.startedAt, 0), hourMs),
    });
  });
  return { outcomes, correct };
}
