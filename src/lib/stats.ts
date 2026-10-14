import { belgradeDate, DAY } from "./dates";
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

const recentBy = (attempts: StatAttempt[], topics: string[], now: Date) =>
  accuracyBy(
    attempts.filter((a) => now.getTime() - a.createdAt.getTime() <= 30 * DAY),
    topics,
    (a) => a.topic,
  );

export function weakest(attempts: StatAttempt[], topics: string[], now: Date) {
  return recentBy(attempts, topics, now)
    .filter((a): a is Accuracy & { pct: number } => a.pct !== null)
    .sort((a, b) => a.pct - b.pct);
}

export function warming(attempts: StatAttempt[], topics: string[], now: Date) {
  return recentBy(attempts, topics, now)
    .filter((a) => a.pct === null && a.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function mistakes(newestFirst: StatAttempt[]) {
  return [...latestStatuses(newestFirst)]
    .filter(([, status]) => status === "wrong")
    .map(([taskId]) => taskId);
}

const dayBefore = (day: string) =>
  new Date(Date.parse(`${day}T12:00:00Z`) - DAY).toISOString().slice(0, 10);

export function streak(days: string[], now: Date) {
  const active = new Set(days);
  let day = belgradeDate(now);
  if (!active.has(day)) day = dayBefore(day);
  let count = 0;
  while (active.has(day)) {
    count++;
    day = dayBefore(day);
  }
  return count;
}
