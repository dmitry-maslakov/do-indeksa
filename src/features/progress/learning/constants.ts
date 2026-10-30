import { clamp } from "es-toolkit";
import { dayMs, hourMs } from "@/lib/dates";

export type Difficulty = 1 | 2 | 3 | 4;

export const easiest: Difficulty = 1;

export const hardest: Difficulty = 4;

export const difficultyOf = (label: number) =>
  clamp(label, easiest, hardest) as Difficulty;

export const attemptGapMs = hourMs;

export const helpedCredit = 0.4;

export const windowSize = 10;

export const warmingBelow = 8;

export const weights: Record<Difficulty, number> = {
  1: 0.5,
  2: 1,
  3: 1.5,
  4: 1.5,
};

export const targets: Record<Difficulty, number> = {
  1: 0.85,
  2: 0.85,
  3: 0.85,
  4: 0.7,
};

export const lostBelowTarget = 0.2;

export const hardFrom: Difficulty = 3;

export const cleanHardNeeded = 3;

export const laterDaysNeeded = 3;

export const spanNeededMs = 18 * hourMs;

export const reviewAfterMs = 14 * dayMs;
