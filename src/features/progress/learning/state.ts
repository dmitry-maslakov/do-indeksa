import type { TopicStatus } from "./status/topic-status";
import type { Difficulty, TryResult } from "./types";

export interface TopicLearning {
  status: TopicStatus;
  ability: number;
  tasksToday: number;
  failStreak: number;
}

export interface TaskHistory {
  topic: string;
  difficulty: Difficulty;
  lastResult: TryResult;
  dueAt: number;
  tries: number;
  lastTryAt: number;
  tz: string | null;
}

export interface Learning {
  topics: Map<string, TopicLearning>;
  tasks: Map<string, TaskHistory>;
}
