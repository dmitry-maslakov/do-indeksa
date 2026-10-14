import { belgradeDate, DAY } from "@/lib/dates";

export interface TaskStat {
  taskId: string;
  number: number;
  topic: string;
  attempts: number;
  right: number;
  recentAttempts: number;
  recentRight: number;
  durationMs: number;
  firstRight: boolean;
  latestRight: boolean;
}

export interface Accuracy {
  key: string | number;
  total: number;
  pct: number | null;
}

export const SAMPLE_MIN = 3;

export const ACCURACY_DAYS = 30;

const sum = (stats: TaskStat[], of: (stat: TaskStat) => number) =>
  stats.reduce((total, stat) => total + of(stat), 0);

export function accuracyBy<K extends string | number>(
  stats: TaskStat[],
  keys: K[],
  keyOf: (stat: TaskStat) => K,
): Accuracy[] {
  return keys.map((key) => {
    const mine = stats.filter((s) => keyOf(s) === key);
    const total = sum(mine, (s) => s.attempts);
    return {
      key,
      total,
      pct:
        total < SAMPLE_MIN
          ? null
          : Math.round((sum(mine, (s) => s.right) / total) * 100),
    };
  });
}

export function meanTimeByNumber(stats: TaskStat[], numbers: number[]) {
  return numbers.map((number) => {
    const mine = stats.filter((s) => s.number === number);
    const attempts = sum(mine, (s) => s.attempts);
    return {
      number,
      meanMs: attempts === 0 ? null : sum(mine, (s) => s.durationMs) / attempts,
    };
  });
}

export function totals(stats: TaskStat[]) {
  const firstRight = stats.filter((s) => s.firstRight).length;
  return {
    solved: stats.filter((s) => s.latestRight).length,
    wrong: stats.filter((s) => !s.latestRight).length,
    firstTryPct:
      stats.length === 0 ? null : Math.round((firstRight / stats.length) * 100),
    spentMs: sum(stats, (s) => s.durationMs),
  };
}

const recentBy = (stats: TaskStat[], topics: string[]) =>
  accuracyBy(
    stats.map((s) => ({
      ...s,
      attempts: s.recentAttempts,
      right: s.recentRight,
    })),
    topics,
    (s) => s.topic,
  );

export function weakest(stats: TaskStat[], topics: string[]) {
  return recentBy(stats, topics)
    .filter((a): a is Accuracy & { pct: number } => a.pct !== null)
    .sort((a, b) => a.pct - b.pct);
}

export function warming(stats: TaskStat[], topics: string[]) {
  return recentBy(stats, topics)
    .filter((a) => a.pct === null && a.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function mistakes(stats: TaskStat[]) {
  return stats.filter((s) => !s.latestRight).map((s) => s.taskId);
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
