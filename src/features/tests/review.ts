import { round, sumBy } from "es-toolkit";
import { isRight, type PartOutcome } from "@/db/columns";
import type { YesNo } from "@/features/catalog/kinds";
import type { Slot } from "@/features/variants/variants";
import { minuteMs } from "@/lib/dates";
import { type Segment, segmentOf } from "@/lib/strip";

export interface ReviewAttempt {
  taskId: string;
  outcomes: PartOutcome[];
  correct: boolean;
  durationMs?: number;
}

export type Shown = { html: string } | { yesno: YesNo };

export interface PartAnswer {
  key: Shown;
  given?: Shown;
}

export type TaskAnswers = Record<string, PartAnswer[]>;

export type ReviewRow<
  T extends Slot = Slot,
  A extends ReviewAttempt = ReviewAttempt,
> = T & {
  attempt?: A;
  earned: number;
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
  timed: boolean;
  spentMs: number;
}

const timedFromMs = minuteMs;

const isBlank = (outcomes: PartOutcome[]) =>
  outcomes.every((outcome) => outcome === "empty");

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
      segment: isBlank(attempt?.outcomes ?? [])
        ? ("none" as const)
        : segmentOf(attempt?.outcomes.map(isRight)),
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
    timed: rows.some((r) => (r.attempt?.durationMs ?? 0) >= timedFromMs),
    spentMs: sumBy(rows, (r) => r.attempt?.durationMs ?? 0),
  };
}
