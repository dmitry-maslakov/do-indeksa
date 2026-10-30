import { mean } from "es-toolkit";
import { defaultPolicy, type LearningPolicy } from "../policy";
import type { Observation } from "../types";
import { abilityOf } from "./elo";

interface Started {
  topic: string;
  history: Observation[];
  firstAt: number;
  start: number;
}

export const startingAbility = (
  others: number[],
  { startAbility }: LearningPolicy = defaultPolicy,
) => (others.length > 0 ? mean(others) : startAbility);

export function topicAbilities(
  topics: string[],
  observations: Map<string, Observation[]>,
  policy: LearningPolicy = defaultPolicy,
) {
  const begun = topics
    .flatMap((topic) => {
      const history = observations.get(topic) ?? [];
      return history.length > 0
        ? { topic, history, firstAt: Math.min(...history.map((o) => o.at)) }
        : [];
    })
    .toSorted((a, b) => a.firstAt - b.firstAt);
  const started: Started[] = [];
  for (const topic of begun) {
    const before = started.flatMap(({ history, start }) => {
      const earlier = history.filter((o) => o.at < topic.firstAt);
      return earlier.length > 0 ? abilityOf(earlier, start, policy) : [];
    });
    started.push({ ...topic, start: startingAbility(before, policy) });
  }
  const abilities = new Map(
    started.map(({ topic, history, start }) => [
      topic,
      abilityOf(history, start, policy),
    ]),
  );
  const fresh = startingAbility([...abilities.values()], policy);
  return new Map(topics.map((topic) => [topic, abilities.get(topic) ?? fresh]));
}
