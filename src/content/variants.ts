import "server-only";
import { allVariants, type Variant } from "content-collections";
import type { Locale } from "next-intl";
import { pick } from "@/lib/pick";
import { parseVariantId } from "@/lib/variant-id";
import { dailySize, numberOf, positionOf, positions } from "./exam";
import { getTask, tasks } from "./tasks";
import { topicName } from "./topics";

export const officialVariants = allVariants
  .filter((v) => v.kind === "official")
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

export const curatedVariants = allVariants.filter((v) => v.kind === "curated");

export interface ExamVariant
  extends Pick<Variant, "id">,
    Partial<Pick<Variant, "title" | "year">> {
  kind: Variant["kind"] | "daily" | "custom";
  taskIds: string[];
}

export const byPosition = positions.map((p) =>
  tasks.filter((t) => t.topic === p.topic).map((t) => t.id),
);

export function getVariant(id: string): ExamVariant | undefined {
  const variant = allVariants.find((v) => v.id === id);
  if (variant) return variant;
  const parsed = parseVariantId(id);
  if (parsed?.kind === "daily") {
    return { id, kind: "daily", taskIds: pick(byPosition, dailySize, id) };
  }
  if (
    parsed?.kind === "custom" &&
    parsed.taskIds.every((taskId) => getTask(taskId))
  ) {
    return { id, kind: "custom", taskIds: byNumber(parsed.taskIds) };
  }
}

export const byNumber = (ids: string[]) =>
  [...ids].sort(
    (a, b) =>
      numberOf(getTask(a)?.topic ?? "") - numberOf(getTask(b)?.topic ?? ""),
  );

export function minutesOf(variant: ExamVariant) {
  return variant.taskIds.reduce((sum, id) => {
    const task = getTask(id);
    return sum + (task ? (positionOf(task.topic)?.minutes ?? 0) : 0);
  }, 0);
}

export function pointsOf(taskId: string) {
  const task = getTask(taskId);
  return task ? (positionOf(task.topic)?.points ?? 0) : 0;
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
      minutes: positionOf(task.topic)?.minutes ?? 0,
      statement: task.statement,
      labels: task.check.map((c) => c.label),
    };
  });
}
