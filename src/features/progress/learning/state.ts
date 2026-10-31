import type { TopicStatus } from "./status/topic-status";

export interface TopicLearning {
  status: TopicStatus;
  ability: number;
  tasksToday: number;
  failStreak: number;
  idleMs: number | null;
}

export type Learning = Map<string, TopicLearning>;
