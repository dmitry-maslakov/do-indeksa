import { maxBy } from "es-toolkit";
import { dateIn } from "@/lib/dates";
import type { Observation, TaskActivity } from "./types";

export const tasksToday = (activity: TaskActivity[], now: number) =>
  new Set(
    activity
      .filter(({ at, tz }) => dateIn(at, tz) === dateIn(now, tz))
      .map((a) => a.taskId),
  ).size;

export const lastActivityAt = (activity: TaskActivity[]) =>
  maxBy(activity, (a) => a.at)?.at ?? null;

export function failStreak(observations: Observation[]) {
  const sorted = observations.toSorted((a, b) => a.at - b.at);
  return sorted.length - 1 - sorted.findLastIndex((o) => o.result !== "fail");
}
