import { dayMs, hourMs } from "@/lib/dates";
import type { Difficulty } from "./types";

export const signalNames = ["levelFit", "hardNeeded", "examTask"] as const;

export type SignalName = (typeof signalNames)[number];

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
  anchors: Record<Difficulty, number>;
  startAbility: number;
  targetChance: number;
  stepBase: number;
  stepDecay: number;
  stepFloor: number;
  evidenceHalfLifeMs: number;
  hardChanceFrom: number;
  signalWeights: Record<SignalName, number>;
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
  anchors: { 1: -2, 2: -1, 3: 0, 4: 1 },
  startAbility: -1,
  targetChance: 0.7,
  stepBase: 0.8,
  stepDecay: 0.15,
  stepFloor: 0.3,
  evidenceHalfLifeMs: 7 * dayMs,
  hardChanceFrom: 0.4,
  signalWeights: { levelFit: 1, hardNeeded: 0.3, examTask: 0.1 },
};
