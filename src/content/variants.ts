import "server-only";
import { allVariants, type Variant } from "content-collections";
import type { Locale } from "next-intl";
import { pick } from "@/lib/pick";
import { dailySize, numberOf, positions } from "./exam";
import { getTask, tasks } from "./tasks";
import { topicName } from "./topics";

export const officialVariants = allVariants
  .filter((v) => v.kind === "official")
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

export const curatedVariants = allVariants.filter((v) => v.kind === "curated");

export interface ExamVariant extends Pick<Variant, "id" | "title" | "year"> {
  kind: Variant["kind"] | "daily" | "random" | "custom";
  taskIds: string[];
}

export const byPosition = positions.map((p) =>
  tasks.filter((t) => t.topic === p.topic).map((t) => t.id),
);

export const belgradeDate = (at = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(at);

export function getVariant(id: string): ExamVariant | undefined {
  const variant = allVariants.find((v) => v.id === id);
  if (variant) return variant;
  if (/^daily-\d{4}-\d{2}-\d{2}$/.test(id)) {
    return { id, kind: "daily", taskIds: pick(byPosition, dailySize, id) };
  }
  if (/^random-[0-9a-f]{8}$/.test(id)) {
    return {
      id,
      kind: "random",
      taskIds: pick(byPosition, positions.length, id),
    };
  }
  const set = /^set-([a-z0-9-]+(?:\.[a-z0-9-]+){0,9})$/.exec(id)?.[1];
  const ids = set?.split(".") ?? [];
  if (ids.length > 0 && ids.every((taskId) => getTask(taskId))) {
    return { id, kind: "custom", taskIds: byNumber(ids) };
  }
}

export const byNumber = (ids: string[]) =>
  [...new Set(ids)].sort(
    (a, b) =>
      numberOf(getTask(a)?.topic ?? "") - numberOf(getTask(b)?.topic ?? ""),
  );

export function minutesOf(variant: ExamVariant) {
  return variant.taskIds.reduce((sum, id) => {
    const task = getTask(id);
    return (
      sum + (task ? (positions[numberOf(task.topic) - 1]?.minutes ?? 0) : 0)
    );
  }, 0);
}

export function pointsOf(taskId: string) {
  const task = getTask(taskId);
  return task ? (positions[numberOf(task.topic) - 1]?.points ?? 0) : 0;
}

export interface ExamTask {
  id: string;
  number: number;
  topic: string;
  topicName: string;
  points: number;
  minutes: number;
  statement: string;
  labels: (string | null)[];
}

export function tasksFor(taskIds: string[], locale: Locale): ExamTask[] {
  return taskIds.flatMap((id) => {
    const task = getTask(id);
    if (!task) return [];
    const number = numberOf(task.topic);
    return {
      id,
      number,
      topic: task.topic,
      topicName: topicName(task.topic, locale),
      points: pointsOf(id),
      minutes: positions[number - 1]?.minutes ?? 0,
      statement: task.statement,
      labels: task.check.map((c) => c.label),
    };
  });
}
