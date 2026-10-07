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

const DAY = 24 * 60 * 60 * 1000;

const belgradeDay = (at: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(at);

export function weakest(attempts: StatAttempt[], topics: string[], now: Date) {
  const recent = attempts.filter(
    (a) => now.getTime() - a.createdAt.getTime() <= 30 * DAY,
  );
  return accuracyBy(recent, topics, (a) => a.topic)
    .filter((a): a is Accuracy & { pct: number } => a.pct !== null)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);
}

export function mistakesThisWeek(newestFirst: StatAttempt[], now: Date) {
  const latest = new Map<string, StatAttempt>();
  for (const a of newestFirst)
    if (!latest.has(a.taskId)) latest.set(a.taskId, a);
  return [...latest.values()]
    .filter(
      (a) => !a.correct && now.getTime() - a.createdAt.getTime() <= 7 * DAY,
    )
    .map((a) => a.taskId);
}

export function streak(newestFirst: StatAttempt[], now: Date) {
  const days = new Set(newestFirst.map((a) => belgradeDay(a.createdAt)));
  let count = 0;
  let at = now.getTime();
  if (!days.has(belgradeDay(now))) at -= DAY;
  while (days.has(belgradeDay(new Date(at)))) {
    count++;
    at -= DAY;
  }
  return count;
}
