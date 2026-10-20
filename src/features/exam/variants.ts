import { orderBy, sumBy } from "es-toolkit";
import type { PartLabel } from "@/features/tasks/parts";
import "server-only";
import { allVariants, type Variant } from "content-collections";
import type { Locale } from "next-intl";
import type { ReviewTask } from "@/features/review/review";
import { getTask, idsByTopic, renderTask } from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { dailySize, numberOf, positionOf, positions } from "./exam";
import { pick } from "./pick";
import { parseVariantId } from "./variant-id";

export const officialVariants = allVariants
  .filter((v) => v.kind === "official")
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

export const curatedVariants = allVariants.filter((v) => v.kind === "curated");

export const contentVariants = [...officialVariants, ...curatedVariants];

export interface ExamVariant
  extends Pick<Variant, "id">,
    Partial<Pick<Variant, "title" | "year">> {
  kind: Variant["kind"] | "daily" | "custom";
  taskIds: string[];
}

export const byPosition = positions.map((p) => idsByTopic.get(p.topic) ?? []);

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
  orderBy(
    ids.map((id) => ({ id, number: numberOf(getTask(id)?.topic ?? "") })),
    ["number"],
    ["asc"],
  ).map((task) => task.id);

export function minutesOf(variant: ExamVariant) {
  return sumBy(variant.taskIds, (id) => {
    const task = getTask(id);
    return task ? (positionOf(task.topic)?.minutes ?? 0) : 0;
  });
}

export function pointsOf(taskId: string) {
  const task = getTask(taskId);
  return task ? (positionOf(task.topic)?.points ?? 0) : 0;
}

export function reviewTasks(taskIds: string[]): ReviewTask[] {
  return taskIds.flatMap((taskId) => {
    const task = getTask(taskId);
    if (!task) return [];
    const position = positionOf(task.topic);
    return {
      taskId,
      number: position?.number ?? 0,
      topic: task.topic,
      points: position?.points ?? 0,
      minutes: position?.minutes ?? 0,
    };
  });
}

export interface ExamTask {
  id: string;
  number: number;
  topic: string;
  topicName: string;
  points: number;
  minutes: number;
  statement: string;
  parts: PartLabel[];
}

export async function tasksFor(
  taskIds: string[],
  locale: Locale,
): Promise<ExamTask[]> {
  const tasks = await Promise.all(
    taskIds.map(async (id) => {
      const task = getTask(id);
      const html = await renderTask(id);
      if (!task || !html) return [];
      return {
        id,
        number: numberOf(task.topic) ?? 0,
        topic: task.topic,
        topicName: topicName(task.topic, locale),
        points: pointsOf(id),
        minutes: positionOf(task.topic)?.minutes ?? 0,
        statement: html.statement,
        parts: html.parts,
      };
    }),
  );
  return tasks.flat();
}
