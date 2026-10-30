import "server-only";
import { cache } from "react";
import { examTopics } from "@/features/catalog/exams";
import { getFirstAttempts, getLastActivity } from "./attempt-log";
import { observe } from "./learning/observation";
import { topicStatus } from "./learning/status/topic-status";

export const getLearning = cache(async (profileId: string) => {
  const now = Date.now();
  const [firstAttempts, lastActivity] = await Promise.all([
    getFirstAttempts(profileId),
    getLastActivity(profileId),
  ]);
  const observations = Map.groupBy(
    firstAttempts.flatMap((attempt) => observe(attempt, now) ?? []),
    (o) => o.topic,
  );
  return new Map(
    examTopics.map((topic) => [
      topic,
      topicStatus(
        observations.get(topic) ?? [],
        lastActivity.get(topic) ?? null,
        now,
      ),
    ]),
  );
});
