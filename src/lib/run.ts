import type { Segment } from "./strip";

interface RunProgress {
  current: number;
  answers: string[][];
}

export const isAnswered = (parts: string[]) => parts.some(Boolean);

export const answeredCount = (run: RunProgress) =>
  run.answers.filter(isAnswered).length;

export const runSegments = (run: RunProgress): Segment[] =>
  run.answers.map((parts, i) =>
    i === run.current ? "current" : isAnswered(parts) ? "done" : "none",
  );

export const blankSegments = (count: number): Segment[] =>
  Array.from({ length: count }, () => "none");

export function nextIndex(run: RunProgress) {
  return [run.current, ...run.answers.keys()].find(
    (i) => !isAnswered(run.answers[i] ?? []),
  );
}

export function minutesLeft(
  run: { startedAt: number; minutes?: number; timed: boolean },
  now: number,
) {
  if (!run.timed || !run.minutes) return undefined;
  return Math.max(
    Math.round((run.startedAt + run.minutes * 60_000 - now) / 60_000),
    0,
  );
}
