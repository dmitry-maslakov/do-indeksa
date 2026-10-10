import { type Segment, segmentOf } from "./strip";

export interface ReviewTask {
  taskId: string;
  number: number;
  topic: string;
  points: number;
  minutes: number;
}

export interface ReviewAttempt {
  taskId: string;
  parts: boolean[];
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

export const creditOf = (parts: boolean[], points: number) =>
  parts.length === 0
    ? 0
    : Math.round((points * parts.filter(Boolean).length * 10) / parts.length) /
      10;

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
      earned: attempt ? creditOf(attempt.parts, task.points) : 0,
      over: (attempt?.durationMs ?? 0) > task.minutes * 60_000,
      segment: segmentOf(attempt?.parts),
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
    score: Math.round(rows.reduce((sum, r) => sum + r.earned, 0) * 10) / 10,
    max: rows.reduce((sum, r) => sum + r.points, 0),
    correct: rows.filter((r) => r.attempt?.correct).length,
    spentMs: rows.reduce((sum, r) => sum + (r.attempt?.durationMs ?? 0), 0),
    normMs: rows.reduce((sum, r) => sum + r.minutes * 60_000, 0),
    lost: [...lost]
      .map(([topic, points]) => ({ topic, points }))
      .sort((a, b) => b.points - a.points),
  };
}
