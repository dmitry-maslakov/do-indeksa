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
import {
  answerAddsText,
  labelOf,
  type PartLabel,
  resultOf,
  uncheckedLetters,
} from "./parts";
import { examSource } from "./source";
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

const byTopic = Map.groupBy(tasks, (t) => t.topic);

export const idsByTopic = new Map(
  Array.from(byTopic, ([topic, group]) => [topic, group.map((t) => t.id)]),
);

export const typesByTopic = new Map(
  Array.from(byTopic, ([topic, group]) => [
    topic,
    [...new Set(group.map((t) => t.type))],
  ]),
);

export const getTask = (id: string) => byId.get(id);

export function taskFacts(id: string) {
  const task = byId.get(id);
  if (!task) throw new Error(`unknown task ${id}`);
  const exam = examSource(task.source);
  return {
    task_id: id,
    topic: task.topic,
    task_type: task.type,
    difficulty: task.difficulty,
    level: levelOf(task.difficulty),
    exam_year: exam?.year,
    exam_position: exam?.position ?? numberOf(task.topic) ?? undefined,
    key_rev: task.keyRev,
    hints_available: task.hints.length,
    parts: task.check.length,
  };
}

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
  answerText: boolean;
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
        ...html.parts.flatMap((p) => [p.prefix, p.suffix, p.caption]),
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

const labelsOf = (task: Task) =>
  task.check.map((c, i, all) => labelOf(c, i, all.length));

const partLabels = new LRUCache<string, PartLabel[]>({
  maxSize: 2 * 1024 * 1024,
  sizeCalculation: (parts) =>
    sumBy(
      parts,
      (p) =>
        (p.prefix?.length ?? 0) +
        (p.suffix?.length ?? 0) +
        (p.caption?.length ?? 0),
    ) + 1,
});

export async function renderParts(task: Task) {
  const cached = partLabels.get(task.id);
  if (cached) return cached;
  const optional = (source: string | null) =>
    source && renderMarkdown(source, task.id);
  const parts = await Promise.all(
    labelsOf(task).map(async (p) => ({
      kind: p.kind,
      arity: p.arity,
      letter: p.letter,
      prefix: await optional(p.prefix),
      suffix: await optional(p.suffix),
      caption: await optional(p.caption),
    })),
  );
  partLabels.set(task.id, parts);
  return parts;
}

export async function renderTask(id: string) {
  const cached = rendered.get(id);
  if (cached) return cached;
  const task = getTask(id);
  if (!task) return null;
  const render = (source: string) => renderMarkdown(source, id);
  const unchecked = uncheckedLetters(task.text, labelsOf(task));
  const html = {
    statement: await renderStatement(task),
    answer: await render(task.answer ?? resultOf(task.check)),
    hints: await Promise.all(task.hints.map(render)),
    solution: await render(task.solution),
    parts: await renderParts(task),
    unchecked,
    answerText:
      unchecked.length > 0 ||
      (task.answer !== null &&
        answerAddsText(
          task.answer,
          task.check.map((c) => c.expected),
        )),
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
