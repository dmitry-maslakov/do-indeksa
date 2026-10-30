import { maxBy } from "es-toolkit";
import type { SuggestionReason } from "@/db/columns";
import type { Observation } from "./learning/observations";
import {
  isMastered,
  type TopicStatus,
  topicStatus,
} from "./learning/topic-status";

export interface TopicProgress extends TopicStatus {
  topic: string;
}

export interface Suggestion {
  topic: string;
  reason: SuggestionReason;
}

export function topicProgress(
  observations: Observation[],
  lastAt: Map<string, number>,
  topics: string[],
  now: number,
): TopicProgress[] {
  const byTopic = Map.groupBy(observations, (o) => o.topic);
  return topics.map((topic) => ({
    topic,
    ...topicStatus(byTopic.get(topic) ?? [], lastAt.get(topic) ?? null, now),
  }));
}

export const lastPracticed = (topics: TopicProgress[]) =>
  maxBy(
    topics.filter((t) => t.lastAt !== null),
    (t) => t.lastAt ?? 0,
  );

export function suggest(
  topics: TopicProgress[],
  latest: boolean[],
): Suggestion | undefined {
  const last = lastPracticed(topics);
  if (!last) {
    const first = topics[0];
    return first && { topic: first.topic, reason: "first" };
  }
  if (latest.filter((right) => !right).length >= 2)
    return { topic: last.topic, reason: "stuck" };
  if (isMastered(last.state)) {
    const at = topics.indexOf(last);
    const next = [...topics.slice(at + 1), ...topics.slice(0, at)].find(
      (t) => !isMastered(t.state),
    );
    return next
      ? { topic: next.topic, reason: "next" }
      : { topic: last.topic, reason: "done" };
  }
  return {
    topic: last.topic,
    reason: last.almost ? "almost" : "started",
  };
}
