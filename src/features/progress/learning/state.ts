import type { TopicStatus } from "./status/topic-status";

export interface TopicLearning {
  status: TopicStatus;
  ability: number;
}

export type Learning = Map<string, TopicLearning>;
