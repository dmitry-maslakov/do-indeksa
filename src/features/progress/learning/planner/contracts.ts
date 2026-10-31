import type {
  LearningPolicy,
  SignalName,
  TaskSignalName,
  TopicSignalName,
} from "../policy";
import type { Learning } from "../state";
import type { Difficulty } from "../types";

export interface Candidate {
  taskId: string;
  topic: string;
  difficulty: Difficulty;
  exam: boolean;
}

export interface TopicCandidate {
  topic: string;
}

export interface PlanContext<C = Candidate> {
  learning: Learning;
  picked: C[];
  policy: LearningPolicy;
}

export interface Signal<C = Candidate, N extends SignalName = TaskSignalName> {
  name: N;
  score: (candidate: C, context: PlanContext<C>) => number;
}

export type TopicSignal = Signal<TopicCandidate, TopicSignalName>;

export interface Decision<
  C = Candidate,
  N extends SignalName = TaskSignalName,
> {
  candidate: C;
  reason: N;
}
