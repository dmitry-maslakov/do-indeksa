import { dayMs, hourMs } from "@/lib/dates";
import type { Difficulty } from "./types";

export const taskSignalNames = ["levelFit", "hardNeeded", "examTask"] as const;

const topicSignalNames = [
  "stuck",
  "review",
  "finishTopic",
  "keepGoing",
  "switchTopic",
  "startNext",
  "keepInShape",
] as const;

export type TaskSignalName = (typeof taskSignalNames)[number];

export type TopicSignalName = (typeof topicSignalNames)[number];

export type SignalName = TaskSignalName | TopicSignalName;

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
  stuckAfter: number;
  tasksPerTopicPerDay: number;
  maxOpenTopics: number;
  keepInShapeAfterMs: number;
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
  stuckAfter: 4,
  tasksPerTopicPerDay: 6,
  maxOpenTopics: 3,
  keepInShapeAfterMs: 7 * dayMs,
  signalWeights: {
    levelFit: 1,
    hardNeeded: 0.3,
    examTask: 0.1,
    stuck: 1,
    review: 0.8,
    finishTopic: 0.6,
    keepGoing: 0.5,
    switchTopic: 0.5,
    startNext: 0.4,
    keepInShape: 0.2,
  },
};
