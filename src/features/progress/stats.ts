import { sumBy } from "es-toolkit";

export interface TaskStat {
  taskId: string;
  number: number | null;
  topic: string;
  attempts: number;
  right: number;
  recentAttempts: number;
  recentRight: number;
  durationMs: number;
  firstRight: boolean;
  latestRight: boolean;
  lastAt: number;
}

export interface Accuracy {
  key: string | number;
  total: number;
  pct: number | null;
}

export const minSample = 3;

export const accuracyDays = 30;

export function accuracyBy<K extends string | number>(
  stats: TaskStat[],
  keys: K[],
  keyOf: (stat: TaskStat) => K | null,
): Accuracy[] {
  return keys.map((key) => {
    const mine = stats.filter((s) => keyOf(s) === key);
    const total = sumBy(mine, (s) => s.attempts);
    return {
      key,
      total,
      pct:
        total < minSample
          ? null
          : Math.round((sumBy(mine, (s) => s.right) / total) * 100),
    };
  });
}

export function meanTimeByNumber(stats: TaskStat[], numbers: number[]) {
  return numbers.map((number) => {
    const mine = stats.filter((s) => s.number === number);
    const attempts = sumBy(mine, (s) => s.attempts);
    return {
      number,
      meanMs:
        attempts === 0 ? null : sumBy(mine, (s) => s.durationMs) / attempts,
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
    spentMs: sumBy(stats, (s) => s.durationMs),
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
