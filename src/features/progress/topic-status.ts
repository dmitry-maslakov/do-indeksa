import { sumBy } from "es-toolkit";
import {
  cleanHardNeeded,
  hardFrom,
  laterDaysNeeded,
  lostBelowTarget,
  reviewAfterMs,
  spanNeededMs,
  targets,
  warmingBelow,
  weights,
  windowSize,
} from "./learning";
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
  share: number;
  lastAt: number | null;
}

const tolerance = 1e-9;

const atLeast = (value: number, bound: number) => value >= bound - tolerance;

const ratio = (value: number, needed: number) => Math.min(1, value / needed);

const weighted = (window: Observation[], pick: (o: Observation) => number) =>
  sumBy(window, (o) => weights[o.difficulty] * pick(o)) /
  sumBy(window, (o) => weights[o.difficulty]);

function measure(window: Observation[]) {
  const score = weighted(window, (o) => o.credit);
  const target = weighted(window, (o) => targets[o.difficulty]);
  const first = window[0];
  const last = window.at(-1);
  const quality = [
    ratio(score, target),
    ratio(
      window.filter((o) => o.result === "clean" && o.difficulty >= hardFrom)
        .length,
      cleanHardNeeded,
    ),
  ];
  const volume = [
    ratio(window.length, windowSize),
    ratio(
      window.filter((o) => first && o.day > first.day).length,
      laterDaysNeeded,
    ),
    ratio(first && last ? last.at - first.at : 0, spanNeededMs),
  ];
  const share =
    Math.min(...quality) * (sumBy(volume, (v) => v) / volume.length);
  return { score, target, share, met: atLeast(share, 1) };
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

export function topicStatus(
  observations: Observation[],
  lastAt: number | null,
  now: number,
): TopicStatus {
  if (lastAt === null) return { state: "notStarted", share: 0, lastAt };
  const sorted = observations.toSorted((a, b) => a.at - b.at);
  if (windows(sorted).reduce(stillMastered, false))
    return {
      state: now - lastAt >= reviewAfterMs ? "review" : "mastered",
      share: 1,
      lastAt,
    };
  const window = sorted.slice(-windowSize);
  return window.length < warmingBelow
    ? { state: "warming", share: window.length / warmingBelow, lastAt }
    : { state: "inProgress", share: measure(window).share, lastAt };
}

const steps: TopicState[] = ["warming", "inProgress"];

export function barFill({ state, share }: TopicStatus) {
  if (isMastered(state)) return 1;
  const step = steps.indexOf(state);
  return step < 0 ? 0 : (step + share) / steps.length;
}
