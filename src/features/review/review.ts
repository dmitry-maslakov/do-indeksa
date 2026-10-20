import { sumBy } from "es-toolkit";
import { isRight, type PartOutcome } from "@/lib/part-outcome";
import { type Segment, segmentOf } from "@/lib/strip";

export interface ReviewTask {
  taskId: string;
  number: number;
  topic: string;
  points: number;
  minutes: number;
}

export interface ReviewAttempt {
  taskId: string;
  outcomes: PartOutcome[];
  correct: boolean;
  durationMs: number;
}

export interface AnswerOutcome {
  given: string;
  key: string;
}

export type Outcomes = Record<string, AnswerOutcome>;

export interface ReviewRow<A extends ReviewAttempt = ReviewAttempt>
  extends ReviewTask {
  attempt?: A;
  earned: number;
  over: boolean;
  segment: Segment;
}

export interface Review<A extends ReviewAttempt = ReviewAttempt> {
  rows: ReviewRow<A>[];
  score: number;
  max: number;
  correct: number;
  spentMs: number;
  normMs: number;
  lost: { topic: string | null; points: number }[];
}

export const reviewHref = (testId: string) => `/review/${testId.slice(0, 8)}`;

export const creditOf = (outcomes: PartOutcome[], points: number) =>
  outcomes.length === 0
    ? 0
    : Math.round(
        (points * outcomes.filter(isRight).length * 10) / outcomes.length,
      ) / 10;

export function review<A extends ReviewAttempt>(
  tasks: ReviewTask[],
  attempts: A[],
): Review<A> {
  const byTask = new Map(attempts.map((a) => [a.taskId, a]));
  const rows = tasks.map((task) => {
    const attempt = byTask.get(task.taskId);
    return {
      ...task,
      attempt,
      earned: attempt ? creditOf(attempt.outcomes, task.points) : 0,
      over: (attempt?.durationMs ?? 0) > task.minutes * 60_000,
      segment: segmentOf(attempt?.outcomes.map(isRight)),
    };
  });

  const lost = new Map<string | null, number>();
  for (const row of rows) {
    if (row.earned === row.points) continue;
    const key = row.attempt ? row.topic : null;
    lost.set(key, (lost.get(key) ?? 0) + row.points - row.earned);
  }

  return {
    rows,
    score: Math.round(sumBy(rows, (r) => r.earned) * 10) / 10,
    max: sumBy(rows, (r) => r.points),
    correct: rows.filter((r) => r.attempt?.correct).length,
    spentMs: sumBy(rows, (r) => r.attempt?.durationMs ?? 0),
    normMs: sumBy(rows, (r) => r.minutes * 60_000),
    lost: [...lost]
      .map(([topic, points]) => ({ topic, points }))
      .sort((a, b) => b.points - a.points),
  };
}
