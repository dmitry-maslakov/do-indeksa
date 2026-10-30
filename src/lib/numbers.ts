import { sumBy } from "es-toolkit";

const tolerance = 1e-9;

export const atLeast = (value: number, bound: number) =>
  value >= bound - tolerance;

export const weightedMean = <T>(
  items: T[],
  weightOf: (item: T) => number,
  scoreOf: (item: T) => number,
) =>
  sumBy(items, (item) => weightOf(item) * scoreOf(item)) /
  sumBy(items, weightOf);
