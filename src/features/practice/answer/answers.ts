import "server-only";
import { isRight } from "@/db/columns";
import { attempts } from "@/db/schema";
import { checkerVersion, gradeParts } from "@/features/catalog/checker";
import { getTask } from "@/features/catalog/tasks";
import {
  factsAt,
  liveSession,
} from "@/features/practice/session/task-sessions";
import { isLocked } from "@/features/progress/learning/sitting-state";
import { getSittingState } from "@/features/progress/sitting";
import { db } from "@/server/db";
import { verdictOf } from "./verdicts";

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

  const sitting = await getSittingState(profileId, taskId);
  if (isLocked(sitting)) return { sitting };

  const outcomes = gradeParts(
    task.check.map((c) => c.expected),
    answers,
  );
  const correct = outcomes.every(isRight);

  return db.transaction(async (tx) => {
    const session = await liveSession(tx, profileId, taskId, sessionId);
    const [attempt] = await tx
      .insert(attempts)
      .values({
        profileId,
        taskId,
        sessionId: session.id,
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
      })
      .returning();
    return { outcomes, correct, session, attempt };
  });
}

export const attemptFacts = async (
  profileId: string,
  attempt: typeof attempts.$inferSelect,
) => ({
  ...(await factsAt(
    profileId,
    attempt.taskId,
    attempt.sessionId,
    attempt.createdAt,
  )),
  answer_client_id: attempt.clientId,
  correct: attempt.correct,
  verdict: verdictOf(attempt.outcomes),
  outcomes: attempt.outcomes,
  checker: attempt.checker,
});
