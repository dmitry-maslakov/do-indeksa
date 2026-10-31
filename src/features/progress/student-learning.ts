import "server-only";
import { cache } from "react";
import { examTopics } from "@/features/catalog/exams";
import { getActivity, getFirstAttempts } from "./attempt-log";
import { topicAbilities } from "./learning/ability/starting";
import { observe } from "./learning/observation";
import {
  failStreak,
  idleMs,
  lastActivityAt,
  tasksToday,
} from "./learning/rhythm";
import type { Learning } from "./learning/state";
import { topicStatus } from "./learning/status/topic-status";

export const getLearning = cache(
  async (profileId: string): Promise<Learning> => {
    const now = Date.now();
    const [firstAttempts, activity] = await Promise.all([
      getFirstAttempts(profileId),
      getActivity(profileId),
    ]);
    const activityOf = Map.groupBy(activity, (a) => a.topic);
    const observations = Map.groupBy(
      firstAttempts.flatMap((attempt) => observe(attempt, now) ?? []),
      (o) => o.topic,
    );
    const abilities = topicAbilities(examTopics, observations);
    return new Map(
      [...abilities].map(([topic, ability]) => {
        const mine = observations.get(topic) ?? [];
        const done = activityOf.get(topic) ?? [];
        const lastAt = lastActivityAt(done);
        return [
          topic,
          {
            status: topicStatus(mine, lastAt, now),
            ability,
            tasksToday: tasksToday(done, now),
            failStreak: failStreak(mine),
            idleMs: idleMs(lastAt, now),
          },
        ];
      }),
    );
  },
);
