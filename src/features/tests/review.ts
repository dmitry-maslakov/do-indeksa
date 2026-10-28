import { round, sumBy } from "es-toolkit";
import { isRight, type PartOutcome } from "@/db/columns";
import type { Slot } from "@/features/variants/variants";
import { minuteMs } from "@/lib/dates";
import { type Segment, segmentOf } from "@/lib/strip";

export interface ReviewAttempt {
  taskId: string;
  outcomes: PartOutcome[];
  correct: boolean;
  durationMs: number;
}

export interface Comparison {
  given: string;
  key: string;
}

export type Comparisons = Record<string, Comparison>;

export type ReviewRow<
  T extends Slot = Slot,
  A extends ReviewAttempt = ReviewAttempt,
> = T & {
  attempt?: A;
  earned: number;
  over: boolean;
  segment: Segment;
};

export interface Review<
  T extends Slot = Slot,
  A extends ReviewAttempt = ReviewAttempt,
> {
  rows: ReviewRow<T, A>[];
  score: number;
  max: number;
  correct: number;
  spentMs: number;
  normMs: number;
}

export const reviewHref = (testId: string) => `/review/${testId.slice(0, 8)}`;

export const creditOf = (outcomes: PartOutcome[], points: number) =>
  outcomes.length === 0
    ? 0
    : Math.round(
        (points * outcomes.filter(isRight).length * 10) / outcomes.length,
      ) / 10;

export function review<T extends Slot, A extends ReviewAttempt>(
  tasks: T[],
  attempts: A[],
): Review<T, A> {
  const byTask = new Map(attempts.map((a) => [a.taskId, a]));
  const rows = tasks.map((task) => {
    const attempt = byTask.get(task.taskId);
    return {
      ...task,
      attempt,
      earned: attempt ? creditOf(attempt.outcomes, task.points) : 0,
      over: (attempt?.durationMs ?? 0) > task.minutes * minuteMs,
      segment: segmentOf(attempt?.outcomes.map(isRight)),
    };
  });

  return {
    rows,
    score: round(
      sumBy(rows, (r) => r.earned),
      1,
    ),
    max: sumBy(rows, (r) => r.points),
    correct: rows.filter((r) => r.attempt?.correct).length,
    spentMs: sumBy(rows, (r) => r.attempt?.durationMs ?? 0),
    normMs: sumBy(rows, (r) => r.minutes * minuteMs),
  };
}
