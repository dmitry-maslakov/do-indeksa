import type { LearningPolicy, SignalName } from "../policy";
import type { Learning } from "../state";
import type { Difficulty } from "../types";

export interface Candidate {
  taskId: string;
  topic: string;
  difficulty: Difficulty;
  exam: boolean;
}

export interface PlanContext {
  learning: Learning;
  picked: Candidate[];
  policy: LearningPolicy;
}

export interface Signal {
  name: SignalName;
  score: (candidate: Candidate, context: PlanContext) => number;
}

export interface Decision {
  candidate: Candidate;
  reason: SignalName;
}
