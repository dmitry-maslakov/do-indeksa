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

export interface ReviewRow extends ReviewTask {
  attempt?: ReviewAttempt;
  earned: number;
  over: boolean;
  segment: Segment;
}

export interface Review {
  rows: ReviewRow[];
  score: number;
  max: number;
  correct: number;
  spentMs: number;
  normMs: number;
  lost: { topic: string | null; points: number }[];
}

export function review(tasks: ReviewTask[], attempts: ReviewAttempt[]): Review {
  const byTask = new Map(attempts.map((a) => [a.taskId, a]));
  const rows = tasks.map((task) => {
    const attempt = byTask.get(task.taskId);
    return {
      ...task,
      attempt,
      earned: attempt?.correct ? task.points : 0,
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
    score: rows.reduce((sum, r) => sum + r.earned, 0),
    max: rows.reduce((sum, r) => sum + r.points, 0),
    correct: rows.filter((r) => r.attempt?.correct).length,
    spentMs: rows.reduce((sum, r) => sum + (r.attempt?.durationMs ?? 0), 0),
    normMs: rows.reduce((sum, r) => sum + r.minutes * 60_000, 0),
    lost: [...lost]
      .map(([topic, points]) => ({ topic, points }))
      .sort((a, b) => b.points - a.points),
  };
}
