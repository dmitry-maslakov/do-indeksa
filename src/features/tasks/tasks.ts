import { sumBy } from "es-toolkit";
import { truncate } from "es-toolkit/compat";
import "server-only";
import { allTasks, type Task } from "content-collections";
import { LRUCache } from "lru-cache";
import type { Locale, useTranslations } from "next-intl";
import { numberOf } from "@/features/exam/exam";
import { renderMarkdown } from "@/lib/markdown";
import { type Level, levelOf } from "./level";
import { topicName } from "./topics";

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

const byId = new Map(allTasks.map((t) => [t.id, t]));

export const idsByTopic = new Map(
  Array.from(
    Map.groupBy(allTasks, (t) => t.topic),
    ([topic, group]) => [topic, group.map((t) => t.id)] as const,
  ),
);

export const getTask = (id: string) => byId.get(id);

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
    sumBy(
      [
        html.statement,
        html.answer,
        html.solution,
        ...html.hints,
        ...html.labels,
      ],
      (part) => part?.length ?? 0,
    ) + 1,
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
  return truncate(meta("task", { topic, headline: task.headline }), {
    length: 60,
    separator: " ",
    omission: "…",
  });
}
