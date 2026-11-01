import { sumBy } from "es-toolkit";

export interface TaskStat {
  taskId: string;
  topic: string;
  attempts: number;
  right: number;
}

const minSample = 3;

export const accuracyDays = 30;

export function weakest(stats: TaskStat[], topics: string[]) {
  return topics
    .flatMap((topic) => {
      const mine = stats.filter((s) => s.topic === topic);
      const total = sumBy(mine, (s) => s.attempts);
      if (total < minSample) return [];
      const pct = Math.round((sumBy(mine, (s) => s.right) / total) * 100);
      return [{ topic, pct }];
    })
    .sort((a, b) => a.pct - b.pct);
}
