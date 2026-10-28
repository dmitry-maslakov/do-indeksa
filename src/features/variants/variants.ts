import "server-only";
import { allVariants, type Variant } from "content-collections";
import { orderBy, sumBy } from "es-toolkit";
import type { Locale } from "next-intl";
import { numberOf, positionOf, positions } from "@/features/catalog/exams";
import type { PartLabel } from "@/features/catalog/parts";
import { getTask, idsByTopic, renderTask } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import { parseVariantId } from "./variant-id";

export const officialVariants = allVariants
  .filter((v) => v.kind === "official")
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

export const curatedVariants = allVariants.filter(
  (v) => v.kind === "curated" || (v.kind === "weekly" && v.released),
);

export const weeklyVariants = allVariants.filter((v) => v.kind === "weekly");

export const contentVariants = [...officialVariants, ...curatedVariants];

export interface ExamVariant
  extends Pick<Variant, "id">,
    Partial<Pick<Variant, "title" | "year" | "original">> {
  kind: Variant["kind"] | "custom";
  taskIds: string[];
}

export const byPosition = positions.map((p) => idsByTopic.get(p.topic) ?? []);

export function getVariant(id: string): ExamVariant | undefined {
  const variant = allVariants.find((v) => v.id === id);
  if (variant) return variant;
  const parsed = parseVariantId(id);
  if (
    parsed?.kind === "custom" &&
    parsed.taskIds.length <= positions.length &&
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

export interface Slot {
  taskId: string;
  number: number;
  topic: string;
  points: number;
  minutes: number;
}

export function slotOf(taskId: string): Slot | undefined {
  const task = getTask(taskId);
  if (!task) return;
  const position = positionOf(task.topic);
  return {
    taskId,
    number: position?.number ?? 0,
    topic: task.topic,
    points: position?.points ?? 0,
    minutes: position?.minutes ?? 0,
  };
}

export const slotsOf = (taskIds: string[]) =>
  taskIds.flatMap((taskId) => slotOf(taskId) ?? []);

export const minutesOf = (variant: ExamVariant) =>
  sumBy(variant.taskIds, (taskId) => slotOf(taskId)?.minutes ?? 0);

export const pointsOf = (taskId: string) => slotOf(taskId)?.points ?? 0;

export interface VariantTask extends Slot {
  topicName: string;
  statement: string;
  parts: PartLabel[];
}

export async function tasksFor(
  taskIds: string[],
  locale: Locale,
): Promise<VariantTask[]> {
  const tasks = await Promise.all(
    taskIds.map(async (taskId) => {
      const slot = slotOf(taskId);
      const html = await renderTask(taskId);
      if (!slot || !html) return [];
      return {
        ...slot,
        topicName: topicName(slot.topic, locale),
        statement: html.statement,
        parts: html.parts,
      };
    }),
  );
  return tasks.flat();
}
