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
  kind: Variant["kind"] | "daily" | "random";
  taskIds: string[];
}

const byPosition = positions.map((p) =>
  tasks.filter((t) => t.topic === p.topic).map((t) => t.id),
);

export const belgradeDate = (at = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(at);

export const randomId = () => `random-${crypto.randomUUID().slice(0, 8)}`;

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
}

export function minutesOf(variant: ExamVariant) {
  const topics = new Set(
    variant.taskIds.map((id) => tasks.find((t) => t.id === id)?.topic),
  );
  return positions
    .filter((p) => topics.has(p.topic))
    .reduce((sum, p) => sum + p.minutes, 0);
}

export interface ExamTask {
  id: string;
  number: number;
  topic: string;
  points: number;
  statement: string;
  labels: (string | null)[];
}

export function examTasks(variant: ExamVariant, locale: Locale): ExamTask[] {
  return variant.taskIds.flatMap((id) => {
    const task = getTask(id);
    if (!task) return [];
    const number = numberOf(task.topic);
    return {
      id,
      number,
      topic: topicName(task.topic, locale),
      points: positions[number - 1]?.points ?? 0,
      statement: task.statement,
      labels: task.check.map((c) => c.label),
    };
  });
}
