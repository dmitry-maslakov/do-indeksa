import type { Segment } from "@/lib/strip";

interface TestProgress {
  current: number;
  answers: string[][];
}

export const isAnswered = (parts: string[]) => parts.some(Boolean);

export const answeredCount = (test: TestProgress) =>
  test.answers.filter(isAnswered).length;

export const testSegments = (test: TestProgress): Segment[] =>
  test.answers.map((parts, i) =>
    i === test.current ? "current" : isAnswered(parts) ? "done" : "none",
  );

export const blankSegments = (count: number): Segment[] =>
  Array.from({ length: count }, () => "none");

export function nextIndex(test: TestProgress) {
  return [test.current, ...test.answers.keys()].find(
    (i) => !isAnswered(test.answers[i] ?? []),
  );
}

export function minutesLeft(
  test: { startedAt: number; minutes: number; timed: boolean },
  now: number,
) {
  if (!test.timed) return undefined;
  return Math.max(
    Math.round((test.startedAt + test.minutes * 60_000 - now) / 60_000),
    0,
  );
}

export const overtimeAt = (
  test: { startedAt: number; minutes: number; timed: boolean },
  now: number,
) => (test.timed ? now > test.startedAt + test.minutes * 60_000 : null);
