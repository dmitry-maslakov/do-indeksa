import "server-only";
import { allTasks, type Task } from "content-collections";
import { numberOf } from "./exam";

export const levels = ["easy", "medium", "hard"] as const;
export type Level = (typeof levels)[number];

export const levelOf = (difficulty: number): Level =>
  difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard";

export interface TaskSummary {
  id: string;
  number: number;
  topic: string;
  difficulty: number;
  level: Level;
  statement: string;
}

export function summarize(task: Task): TaskSummary {
  return {
    id: task.id,
    number: numberOf(task.topic),
    topic: task.topic,
    difficulty: task.difficulty,
    level: levelOf(task.difficulty),
    statement: task.statement,
  };
}

export const tasks = allTasks;
