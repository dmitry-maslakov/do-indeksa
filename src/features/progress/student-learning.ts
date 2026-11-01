import "server-only";
import { cache } from "react";
import { getActivity, getTaskLogs } from "./attempt-log";
import { learningAsOf } from "./learning/build-learning";
import type { Learning } from "./learning/state";

export const getTimeline = cache(async (profileId: string) => {
  const [logs, activity] = await Promise.all([
    getTaskLogs(profileId),
    getActivity(profileId),
  ]);
  const now = Date.now();
  return { now, learningAt: learningAsOf({ logs, activity }, now) };
});

export async function getLearning(profileId: string): Promise<Learning> {
  const { now, learningAt } = await getTimeline(profileId);
  return learningAt(now);
}
