import { atLeast, weightedMean } from "@/lib/numbers";
import type { LearningPolicy } from "../policy";
import type { Observation } from "../types";

type Condition = (
  window: Observation[],
  policy: LearningPolicy,
  typeCount: number,
) => boolean;

export const scoreOf = (window: Observation[], { weights }: LearningPolicy) =>
  weightedMean(
    window,
    (o) => weights[o.difficulty],
    (o) => o.credit,
  );

export const targetOf = (
  window: Observation[],
  { weights, targets }: LearningPolicy,
) =>
  weightedMean(
    window,
    (o) => weights[o.difficulty],
    (o) => targets[o.difficulty],
  );

const fullWindow: Condition = (window, { windowSize }) =>
  window.length >= windowSize;

const solvesAtTarget: Condition = (window, policy) =>
  window.length > 0 &&
  atLeast(scoreOf(window, policy), targetOf(window, policy));

const cleanHardEnough: Condition = (window, { hardFrom, cleanHardNeeded }) =>
  window.filter((o) => o.result === "clean" && o.difficulty >= hardFrom)
    .length >= cleanHardNeeded;

export const cleanTypesOf = (window: Observation[]) => [
  ...new Set(window.filter((o) => o.result === "clean").map((o) => o.type)),
];

const typesCovered: Condition = (window, { typesNeeded }, typeCount) =>
  cleanTypesOf(window).length >= Math.min(typesNeeded, typeCount);

const spreadOverDays: Condition = (window, { laterDaysNeeded }) => {
  const first = window[0];
  return (
    first !== undefined &&
    window.filter((o) => o.day > first.day).length >= laterDaysNeeded
  );
};

const spansHours: Condition = (window, { spanNeededMs }) => {
  const first = window[0];
  const last = window.at(-1);
  return (
    first !== undefined &&
    last !== undefined &&
    last.at - first.at >= spanNeededMs
  );
};

export const masteredConditions = {
  fullWindow,
  solvesAtTarget,
  cleanHardEnough,
  typesCovered,
  spreadOverDays,
  spansHours,
};

export type ConditionName = keyof typeof masteredConditions;

export const qualityConditions: ConditionName[] = [
  "solvesAtTarget",
  "cleanHardEnough",
  "typesCovered",
];

export const unmetConditions = (
  window: Observation[],
  typeCount: number,
  policy: LearningPolicy,
) =>
  Object.entries(masteredConditions).flatMap(([name, holds]) =>
    holds(window, policy, typeCount) ? [] : [name as ConditionName],
  );
