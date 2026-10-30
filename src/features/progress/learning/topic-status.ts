import { meanBy } from "es-toolkit";
import { atLeast, weightedMean } from "@/lib/numbers";
import {
  cleanHardNeeded,
  hardest,
  hardFrom,
  laterDaysNeeded,
  lostBelowTarget,
  reviewAfterMs,
  spanNeededMs,
  targets,
  warmingBelow,
  weights,
  windowSize,
} from "./constants";
import type { Observation } from "./observations";

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
  lastAt: number | null;
}

const weightOf = (o: Observation) => weights[o.difficulty];

function measure(window: Observation[]) {
  const score = weightedMean(window, weightOf, (o) => o.credit);
  const target = weightedMean(window, weightOf, (o) => targets[o.difficulty]);
  const first = window[0];
  const last = window.at(-1);
  const solvesWell =
    atLeast(score, target) &&
    window.filter((o) => o.result === "clean" && o.difficulty >= hardFrom)
      .length >= cleanHardNeeded;
  const settled =
    window.length === windowSize &&
    window.filter((o) => first && o.day > first.day).length >=
      laterDaysNeeded &&
    first !== undefined &&
    last !== undefined &&
    last.at - first.at >= spanNeededMs;
  const level = meanBy(window, (o) => o.difficulty);
  return {
    score,
    target,
    solvesWell,
    met: solvesWell && settled,
    fill: (Math.min(1, score / target) * level) / hardest,
  };
}

const windows = (observations: Observation[]) =>
  observations.map((_, i) =>
    observations.slice(Math.max(0, i + 1 - windowSize), i + 1),
  );

function stillMastered(mastered: boolean, window: Observation[]) {
  const { score, target, met } = measure(window);
  return mastered ? atLeast(score, target - lostBelowTarget) : met;
}

export const isMastered = (state: TopicState) =>
  state === "mastered" || state === "review";

function stateOf(
  observations: Observation[],
  lastAt: number,
  now: number,
): TopicState {
  if (windows(observations).reduce(stillMastered, false))
    return now - lastAt >= reviewAfterMs ? "review" : "mastered";
  return Math.min(observations.length, windowSize) < warmingBelow
    ? "warming"
    : "inProgress";
}

export function topicStatus(
  observations: Observation[],
  lastAt: number | null,
  now: number,
): TopicStatus {
  if (lastAt === null)
    return { state: "notStarted", fill: 0, almost: false, lastAt };
  const sorted = observations.toSorted((a, b) => a.at - b.at);
  const window = sorted.slice(-windowSize);
  const state = stateOf(sorted, lastAt, now);
  if (window.length === 0) return { state, fill: 0, almost: false, lastAt };
  const { fill, solvesWell, met } = measure(window);
  return {
    state,
    fill,
    almost: !isMastered(state) && solvesWell && !met,
    lastAt,
  };
}
