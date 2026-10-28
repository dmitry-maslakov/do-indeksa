import { minuteMs } from "@/lib/dates";

interface TestProgress {
  current: number;
  answers: string[][];
}

export const isAnswered = (parts: string[]) => parts.some(Boolean);

export const answeredCount = (test: TestProgress) =>
  test.answers.filter(isAnswered).length;

export function nextIndex(test: TestProgress) {
  return [test.current, ...test.answers.keys()].find(
    (i) => !isAnswered(test.answers[i] ?? []),
  );
}

export const overtimeAt = (
  test: { startedAt: number; minutes: number; timed: boolean },
  now: number,
) => (test.timed ? now > test.startedAt + test.minutes * minuteMs : null);
