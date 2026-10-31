import { dayMs, hourMs } from "@/lib/dates";
import type { Difficulty, TryResult } from "./types";

export const taskSignalNames = [
  "levelFit",
  "hardNeeded",
  "examTask",
  "repeatDue",
  "newType",
] as const;

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
  typesNeeded: number;
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
  repeatAfterMs: Record<TryResult, number>;
  solvedRepeatAfterMs: number;
  missedRepeatAfterMs: number;
  missedAgainAfterMs: number;
  repeatPriority: Record<TryResult, number>;
  overdueExtra: number;
  overdueHalfMs: number;
  maxRepeats: number;
  repeatsWindow: number;
  repeatLevelsAbove: number;
  stretchLevelsAbove: number;
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
  typesNeeded: 3,
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
  repeatAfterMs: {
    wrong: dayMs,
    partlyRight: 3 * dayMs,
    helped: 7 * dayMs,
    clean: 30 * dayMs,
  },
  solvedRepeatAfterMs: 30 * dayMs,
  missedRepeatAfterMs: 3 * dayMs,
  missedAgainAfterMs: 6 * dayMs,
  repeatPriority: { wrong: 1, partlyRight: 0.75, helped: 0.5, clean: 0.25 },
  overdueExtra: 0.2,
  overdueHalfMs: 7 * dayMs,
  maxRepeats: 2,
  repeatsWindow: 6,
  repeatLevelsAbove: 1,
  stretchLevelsAbove: 3,
  signalWeights: {
    levelFit: 1,
    hardNeeded: 0.3,
    examTask: 0.1,
    repeatDue: 1,
    newType: 0.3,
    stuck: 1,
    review: 0.8,
    finishTopic: 0.6,
    keepGoing: 0.5,
    switchTopic: 0.5,
    startNext: 0.4,
    keepInShape: 0.2,
  },
};
