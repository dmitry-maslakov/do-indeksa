import { maxBy } from "es-toolkit";
import type { LearningPolicy } from "../../policy";
import type { Learning } from "../../state";

export const lastPracticed = (learning: Learning) =>
  maxBy(
    [...learning].filter(([, t]) => t.status.lastAt !== null),
    ([, t]) => t.status.lastAt ?? 0,
  )?.[0];

export function restingToday(learning: Learning, policy: LearningPolicy) {
  const last = lastPracticed(learning);
  return last !== undefined &&
    (learning.get(last)?.tasksToday ?? 0) >= policy.tasksPerTopicPerDay
    ? last
    : undefined;
}
