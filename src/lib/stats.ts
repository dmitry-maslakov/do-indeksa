import { latestStatuses } from "./progress";

export interface StatAttempt {
  taskId: string;
  number: number;
  topic: string;
  correct: boolean;
  durationMs: number;
  createdAt: Date;
}

export interface Accuracy {
  key: string | number;
  total: number;
  pct: number | null;
}

export const SAMPLE_MIN = 3;

export function accuracyBy<K extends string | number>(
  attempts: StatAttempt[],
  keys: K[],
  keyOf: (a: StatAttempt) => K,
): Accuracy[] {
  return keys.map((key) => {
    const mine = attempts.filter((a) => keyOf(a) === key);
    const right = mine.filter((a) => a.correct).length;
    return {
      key,
      total: mine.length,
      pct:
        mine.length < SAMPLE_MIN
          ? null
          : Math.round((right / mine.length) * 100),
    };
  });
}

export function meanTimeByNumber(attempts: StatAttempt[], numbers: number[]) {
  return numbers.map((number) => {
    const mine = attempts.filter((a) => a.number === number);
    return {
      number,
      meanMs:
        mine.length === 0
          ? null
          : mine.reduce((sum, a) => sum + a.durationMs, 0) / mine.length,
    };
  });
}

export function totals(newestFirst: StatAttempt[]) {
  const statuses = latestStatuses(newestFirst);
  const first = new Map<string, boolean>();
  for (const a of newestFirst) first.set(a.taskId, a.correct);
  const firstRight = [...first.values()].filter(Boolean).length;
  return {
    solved: [...statuses.values()].filter((s) => s === "solved").length,
    wrong: [...statuses.values()].filter((s) => s === "wrong").length,
    firstTryPct:
      first.size === 0 ? null : Math.round((firstRight / first.size) * 100),
    spentMs: newestFirst.reduce((sum, a) => sum + a.durationMs, 0),
  };
}
