import "server-only";
import { cache } from "react";
import { examTopics } from "@/features/catalog/exams";
import { typesByTopic } from "@/features/catalog/tasks";
import { getActivity, getTaskLogs } from "./attempt-log";
import { topicAbilities } from "./learning/ability/starting";
import { observe } from "./learning/observation";
import { taskHistory } from "./learning/repeats/history";
import { failStreak, lastActivityAt, tasksToday } from "./learning/rhythm";
import type { Learning } from "./learning/state";
import { topicStatus } from "./learning/status/topic-status";

export const getLearning = cache(
  async (profileId: string): Promise<Learning> => {
    const now = Date.now();
    const [{ firstAttempts, taskLogs }, activity] = await Promise.all([
      getTaskLogs(profileId),
      getActivity(profileId),
    ]);
    const activityOf = Map.groupBy(activity, (a) => a.topic);
    const observations = Map.groupBy(
      firstAttempts.flatMap((attempt) => observe(attempt, now) ?? []),
      (o) => o.topic,
    );
    const abilities = topicAbilities(examTopics, observations);
    const topics = [...abilities].map(([topic, ability]) => {
      const mine = observations.get(topic) ?? [];
      const done = activityOf.get(topic) ?? [];
      const typeCount = typesByTopic.get(topic)?.length ?? 0;
      return [
        topic,
        {
          status: topicStatus(mine, typeCount, lastActivityAt(done), now),
          ability,
          tasksToday: tasksToday(done, now),
          failStreak: failStreak(mine),
        },
      ] as const;
    });
    const tasks = taskLogs.flatMap((log) => {
      const history = taskHistory(log, now);
      return history ? [[log.taskId, history] as const] : [];
    });
    return { topics: new Map(topics), tasks: new Map(tasks) };
  },
);
