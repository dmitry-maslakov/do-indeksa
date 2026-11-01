import { memoize } from "es-toolkit";
import { examTopics } from "@/features/catalog/exams";
import { typesByTopic } from "@/features/catalog/tasks";
import { topicAbilities } from "./ability/starting";
import { observe } from "./observation";
import { taskHistory } from "./repeats/history";
import { failStreak, lastActivityAt, tasksToday } from "./rhythm";
import type { Learning } from "./state";
import { topicStatus } from "./status/topic-status";
import type { TaskActivity, TaskLog, TaskLogs } from "./types";

interface Evidence {
  logs: TaskLogs;
  activity: TaskActivity[];
}

const logsBefore = (logs: TaskLog[], at: number) =>
  logs.map((log) => ({
    ...log,
    submits: log.submits.filter((s) => s.at < at),
    reveals: log.reveals.filter((r) => r.at < at),
    skips: log.skips.filter((skipped) => skipped < at),
  }));

const evidenceBefore = (
  { logs, activity }: Evidence,
  at: number,
): Evidence => ({
  logs: {
    firstAttempts: logsBefore(logs.firstAttempts, at),
    taskLogs: logsBefore(logs.taskLogs, at),
  },
  activity: activity.filter((a) => a.at < at),
});

function buildLearning({ logs, activity }: Evidence, now: number): Learning {
  const activityOf = Map.groupBy(activity, (a) => a.topic);
  const observations = Map.groupBy(
    logs.firstAttempts.flatMap((attempt) => observe(attempt, now) ?? []),
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
  const tasks = logs.taskLogs.flatMap((log) => {
    const history = taskHistory(log, now);
    return history ? [[log.taskId, history] as const] : [];
  });
  return { topics: new Map(topics), tasks: new Map(tasks) };
}

export const learningAsOf = (evidence: Evidence, now: number) =>
  memoize((moment: number) =>
    moment < now
      ? buildLearning(evidenceBefore(evidence, moment), moment)
      : buildLearning(evidence, now),
  );
