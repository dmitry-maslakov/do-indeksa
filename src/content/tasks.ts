import "server-only";
import { allTasks, type Task } from "content-collections";
import type { Locale, useTranslations } from "next-intl";
import { clip } from "@/lib/clip";
import { numberOf } from "./exam";
import { topicName } from "./topics";

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

export function getTask(id: string) {
  return allTasks.find((t) => t.id === id);
}

export function siblings(task: Task) {
  return allTasks
    .filter((t) => t.topic === task.topic)
    .map(({ id, topic, difficulty, preview }) => ({
      id,
      number: numberOf(topic),
      level: levelOf(difficulty),
      preview,
    }));
}

export function taskTitle(
  task: Task,
  locale: Locale,
  meta: ReturnType<typeof useTranslations<"Metadata">>,
) {
  const topic = topicName(task.topic, locale);
  return clip(meta("task", { topic, headline: task.headline }), 60);
}
