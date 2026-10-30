import "server-only";
import { cache } from "react";
import { examTopics } from "@/features/catalog/exams";
import { getFirstAttempts, getLastActivity } from "./attempt-log";
import { topicAbilities } from "./learning/ability/starting";
import { observe } from "./learning/observation";
import type { Learning } from "./learning/state";
import { topicStatus } from "./learning/status/topic-status";

export const getLearning = cache(
  async (profileId: string): Promise<Learning> => {
    const now = Date.now();
    const [firstAttempts, lastActivity] = await Promise.all([
      getFirstAttempts(profileId),
      getLastActivity(profileId),
    ]);
    const observations = Map.groupBy(
      firstAttempts.flatMap((attempt) => observe(attempt, now) ?? []),
      (o) => o.topic,
    );
    const abilities = topicAbilities(examTopics, observations);
    return new Map(
      [...abilities].map(([topic, ability]) => [
        topic,
        {
          status: topicStatus(
            observations.get(topic) ?? [],
            lastActivity.get(topic) ?? null,
            now,
          ),
          ability,
        },
      ]),
    );
  },
);
