import { meanBy } from "es-toolkit";
import { atLeast } from "@/lib/numbers";
import { defaultPolicy, type LearningPolicy } from "../policy";
import { hardest, type Observation } from "../types";
import {
  type ConditionName,
  cleanTypesOf,
  qualityConditions,
  scoreOf,
  targetOf,
  unmetConditions,
} from "./conditions";

export const topicStates = [
  "notStarted",
  "warming",
  "inProgress",
  "mastered",
  "review",
] as const;

export type TopicState = (typeof topicStates)[number];

export interface TopicStatus {
  state: TopicState;
  fill: number;
  almost: boolean;
  missing: ConditionName[];
  cleanTypes: string[];
  lastAt: number | null;
}

export const isMastered = (state: TopicState) =>
  state === "mastered" || state === "review";

export const isOpen = (state: TopicState) =>
  state !== "notStarted" && !isMastered(state);

const windows = (observations: Observation[], size: number) =>
  observations.map((_, i) =>
    observations.slice(Math.max(0, i + 1 - size), i + 1),
  );

function masteredAtEnd(
  observations: Observation[],
  typeCount: number,
  policy: LearningPolicy,
) {
  return windows(observations, policy.windowSize).reduce(
    (mastered, window) =>
      mastered
        ? atLeast(
            scoreOf(window, policy),
            targetOf(window, policy) - policy.lostBelowTarget,
          )
        : unmetConditions(window, typeCount, policy).length === 0,
    false,
  );
}

function fillOf(window: Observation[], policy: LearningPolicy) {
  if (window.length === 0) return 0;
  const solved = Math.min(
    1,
    scoreOf(window, policy) / targetOf(window, policy),
  );
  return (solved * meanBy(window, (o) => o.difficulty)) / hardest;
}

function stateOf(
  sorted: Observation[],
  window: Observation[],
  typeCount: number,
  lastActivityAt: number | null,
  now: number,
  policy: LearningPolicy,
): TopicState {
  if (lastActivityAt === null) return "notStarted";
  if (masteredAtEnd(sorted, typeCount, policy))
    return now - lastActivityAt >= policy.reviewAfterMs ? "review" : "mastered";
  return window.length < policy.warmingBelow ? "warming" : "inProgress";
}

export function topicStatus(
  observations: Observation[],
  typeCount: number,
  lastActivityAt: number | null,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): TopicStatus {
  const sorted = observations.toSorted((a, b) => a.at - b.at);
  const window = sorted.slice(-policy.windowSize);
  const state = stateOf(sorted, window, typeCount, lastActivityAt, now, policy);
  const missing = unmetConditions(window, typeCount, policy);
  const solvesWell = !missing.some((name) => qualityConditions.includes(name));
  return {
    state,
    fill: fillOf(window, policy),
    almost: !isMastered(state) && solvesWell && missing.length > 0,
    missing,
    cleanTypes: cleanTypesOf(window),
    lastAt: lastActivityAt,
  };
}
