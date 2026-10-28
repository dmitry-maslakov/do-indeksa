import "server-only";
import { allTasks, allVariants, type Task } from "content-collections";
import { sumBy } from "es-toolkit";
import { truncate } from "es-toolkit/compat";
import { LRUCache } from "lru-cache";
import type { Locale, useTranslations } from "next-intl";
import { z } from "zod";
import { renderMarkdown } from "@/lib/markdown";
import { numberOf } from "./exams";
import { type Level, levelOf } from "./level";
import { type PartLabel, splitLabel, uncheckedLetters } from "./parts";
import { topicName } from "./topics";

export interface TaskSummary {
  id: string;
  number: number | null;
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

const unreleased = new Set(
  allVariants.flatMap((v) =>
    v.kind === "weekly" && !v.released ? v.taskIds : [],
  ),
);

export const tasks = allTasks.filter((t) => !unreleased.has(t.id));

const byId = new Map(allTasks.map((t) => [t.id, t]));

export const idsByTopic = new Map(
  Array.from(
    Map.groupBy(tasks, (t) => t.topic),
    ([topic, group]) => [topic, group.map((t) => t.id)] as const,
  ),
);

export const getTask = (id: string) => byId.get(id);

export const taskIdSchema = z
  .string()
  .refine((id) => getTask(id) !== undefined);

type RenderedTask = {
  statement: string;
  answer: string;
  hints: string[];
  solution: string;
  parts: PartLabel[];
  unchecked: string[];
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
        ...html.parts.flatMap((p) => [p.prefix, p.caption]),
      ],
      (part) => part?.length ?? 0,
    ) + 1,
});

const statements = new LRUCache<string, string>({
  maxSize: 8 * 1024 * 1024,
  sizeCalculation: (html) => html.length + 1,
});

export async function renderStatement(task: Task) {
  const cached = statements.get(task.id);
  if (cached !== undefined) return cached;
  const html = await renderMarkdown(task.text, task.id);
  statements.set(task.id, html);
  return html;
}

export async function renderTask(id: string) {
  const cached = rendered.get(id);
  if (cached) return cached;
  const task = getTask(id);
  if (!task) return null;
  const render = (source: string) => renderMarkdown(source, id);
  const optional = (source: string | null) => source && render(source);
  const labels = task.check.map((c, i, all) =>
    splitLabel(c.label, i, all.length),
  );
  const html = {
    statement: await renderStatement(task),
    answer: await render(task.answer),
    hints: await Promise.all(task.hints.map(render)),
    solution: await render(task.solution),
    parts: await Promise.all(
      labels.map(async (p) => ({
        letter: p.letter,
        prefix: await optional(p.prefix),
        caption: await optional(p.caption),
      })),
    ),
    unchecked: uncheckedLetters(task.text, labels),
  };
  rendered.set(id, html);
  return html;
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
