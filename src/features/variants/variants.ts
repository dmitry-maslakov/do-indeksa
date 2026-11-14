import "server-only";
import { allVariants, type Task, type Variant } from "content-collections";
import { sumBy } from "es-toolkit";
import type { Locale } from "next-intl";
import type { RenderedChoice } from "@/features/catalog/choice";
import { examOf, examRecord, maxPlaces } from "@/features/catalog/exams";
import type { PartLabel } from "@/features/catalog/parts";
import {
  getTask,
  idsByTopic,
  renderChoice,
  renderParts,
  renderStatement,
} from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import { customTaskIds } from "./variant-id";

export const officialVariants = allVariants
  .filter((v) => v.kind === "official")
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

export const examPapers = (examId: string) => {
  const { tests } = examRecord(examId);
  return officialVariants
    .filter((v) => tests.includes(v.test))
    .map((v) => ({
      ...v,
      year: v.year ?? 0,
      topics: v.taskIds.map((id) => getTask(id)?.topic ?? ""),
    }));
};

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

export const positionPools = (examId: string) =>
  examOf(examId).positions.map((p) => idsByTopic.get(p.topic) ?? []);

const customIds = (id: string) => customTaskIds(id, maxPlaces, getTask);

export const isVariant = (id: string) =>
  allVariants.some((v) => v.id === id) || customIds(id) !== undefined;

export function getVariant(
  examId: string,
  id: string,
): ExamVariant | undefined {
  const variant = allVariants.find((v) => v.id === id);
  if (variant) return variant;
  const taskIds = customIds(id);
  if (taskIds)
    return { id, kind: "custom", taskIds: inExamOrder(examId, taskIds) };
}

export const inExamOrder = (examId: string, ids: string[]) => {
  const { topics } = examOf(examId);
  const rank = (id: string) => topics.indexOf(getTask(id)?.topic ?? "");
  return ids.toSorted((a, b) => rank(a) - rank(b));
};

export interface Slot {
  taskId: string;
  number: number;
  topic: string;
  points: number;
  minutes: number;
  scoring: Task["scoring"];
}

export const slotsOf = (examId: string, taskIds: string[]): Slot[] =>
  taskIds
    .flatMap((id) => getTask(id) ?? [])
    .flatMap((task, index) => {
      const place = examOf(examId).positions[index];
      if (!place) return [];
      return {
        taskId: task.id,
        number: place.number,
        topic: task.topic,
        points: place.points,
        minutes: place.minutes,
        scoring: task.scoring,
      };
    });

export const minutesOf = (examId: string, variant: ExamVariant) =>
  sumBy(slotsOf(examId, variant.taskIds), (slot) => slot.minutes);

export const pointsOf = (examId: string, variant: ExamVariant) =>
  sumBy(slotsOf(examId, variant.taskIds), (slot) => slot.points);

export interface VariantTask extends Slot {
  topicName: string;
  statement: string;
  parts: PartLabel[];
  choice: RenderedChoice | null;
}

export async function tasksFor(
  examId: string,
  taskIds: string[],
  locale: Locale,
): Promise<VariantTask[]> {
  const tasks = await Promise.all(
    slotsOf(examId, taskIds).map(async (slot) => {
      const task = getTask(slot.taskId);
      if (!task) return [];
      return {
        ...slot,
        topicName: topicName(slot.topic, locale),
        statement: await renderStatement(task),
        parts: await renderParts(task),
        choice: await renderChoice(task),
      };
    }),
  );
  return tasks.flat();
}
