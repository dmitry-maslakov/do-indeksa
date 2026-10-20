import "server-only";
import { attempts } from "@/db/schema";
import { gradeParts } from "@/lib/math";
import { isRight } from "@/lib/part-outcome";
import { db } from "@/server/db";
import { liveSession } from "./sessions";
import { getTask } from "./tasks";

interface Answer {
  taskId: string;
  answers: string[];
  sessionId?: string;
}

export async function submitAnswer(
  profileId: string,
  { taskId, answers, sessionId }: Answer,
) {
  const task = getTask(taskId);
  if (!task) throw new Error(`unknown task ${taskId}`);

  const outcomes = gradeParts(
    task.check.map((c) => c.expected),
    answers,
  );
  const correct = outcomes.every(isRight);

  const session = await db.transaction(async (tx) => {
    const id = await liveSession(tx, profileId, taskId, sessionId);
    await tx.insert(attempts).values({
      profileId,
      taskId,
      sessionId: id,
      answers,
      outcomes,
      correct,
    });
    return id;
  });
  return { outcomes, correct, sessionId: session };
}
