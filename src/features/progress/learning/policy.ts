import { dayMs, hourMs } from "@/lib/dates";
import type { Difficulty } from "./types";

export interface LearningPolicy {
  attemptGapMs: number;
  helpedCredit: number;
  windowSize: number;
  warmingBelow: number;
  weights: Record<Difficulty, number>;
  targets: Record<Difficulty, number>;
  lostBelowTarget: number;
  hardFrom: Difficulty;
  cleanHardNeeded: number;
  laterDaysNeeded: number;
  spanNeededMs: number;
  reviewAfterMs: number;
}

export const defaultPolicy: LearningPolicy = {
  attemptGapMs: hourMs,
  helpedCredit: 0.4,
  windowSize: 10,
  warmingBelow: 8,
  weights: { 1: 0.5, 2: 1, 3: 1.5, 4: 1.5 },
  targets: { 1: 0.85, 2: 0.85, 3: 0.85, 4: 0.7 },
  lostBelowTarget: 0.2,
  hardFrom: 3,
  cleanHardNeeded: 3,
  laterDaysNeeded: 3,
  spanNeededMs: 18 * hourMs,
  reviewAfterMs: 14 * dayMs,
};
