import "server-only";
import { allTasks, type Task } from "content-collections";
import { LRUCache } from "lru-cache";
import type { Locale, useTranslations } from "next-intl";
import type { Level } from "@/lib/bank-params";
import { clip } from "@/lib/clip";
import { renderMarkdown } from "@/lib/markdown";
import { numberOf } from "./exam";
import { topicName } from "./topics";

export const levelOf = (difficulty: number): Level =>
  difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard";

export interface TaskSummary {
  id: string;
  number: number;
  topic: string;
  difficulty: number;
  level: Level;
}

export function summarize(task: Task): TaskSummary {
  return {
    id: task.id,
    number: numberOf(task.topic),
    topic: task.topic,
    difficulty: task.difficulty,
    level: levelOf(task.difficulty),
  };
}

export const tasks = allTasks;

type RenderedTask = {
  statement: string;
  answer: string;
  hints: string[];
  solution: string;
  labels: (string | null)[];
};

const rendered = new LRUCache<string, RenderedTask>({
  maxSize: 32 * 1024 * 1024,
  sizeCalculation: (html) =>
    [html.statement, html.answer, html.solution, ...html.hints, ...html.labels]
      .map((part) => part?.length ?? 0)
      .reduce((sum, length) => sum + length, 1),
});

export async function renderTask(id: string) {
  const cached = rendered.get(id);
  if (cached) return cached;
  const task = getTask(id);
  if (!task) return null;
  const render = (source: string) => renderMarkdown(source, id);
  const html = {
    statement: await render(task.text),
    answer: await render(task.answer),
    hints: await Promise.all(task.hints.map(render)),
    solution: await render(task.solution),
    labels: await Promise.all(
      task.check.map((c) => (c.label ? render(c.label) : null)),
    ),
  };
  rendered.set(id, html);
  return html;
}

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
