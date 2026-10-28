import "server-only";
import { isRight } from "@/db/columns";
import { attempts } from "@/db/schema";
import { checkerVersion, gradeParts } from "@/features/catalog/checker";
import { getTask } from "@/features/catalog/tasks";
import { liveSession } from "@/features/practice/session/task-sessions";
import { db } from "@/server/db";

interface Answer {
  taskId: string;
  answers: string[];
  sessionId?: string;
  clientId: string;
}

export async function submitAnswer(
  profileId: string,
  { taskId, answers, sessionId, clientId }: Answer,
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
    await tx
      .insert(attempts)
      .values({
        profileId,
        taskId,
        sessionId: id,
        clientId,
        answers,
        outcomes,
        correct,
        difficulty: task.difficulty,
        keyRev: task.keyRev,
        checker: checkerVersion,
      })
      .onConflictDoNothing({
        target: [attempts.profileId, attempts.clientId],
      });
    return id;
  });
  return { outcomes, correct, sessionId: session };
}
