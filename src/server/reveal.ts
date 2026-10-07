"use server";

import { z } from "zod";
import { getTask } from "@/content/tasks";

const partSchema = z.union([
  z.literal("answer"),
  z.literal("solution"),
  z.number().int().min(0).max(2),
]);

export type RevealPart = z.infer<typeof partSchema>;

export async function reveal(
  taskId: string,
  part: RevealPart,
): Promise<string | null> {
  const task = getTask(z.string().parse(taskId));
  const which = partSchema.parse(part);
  if (!task) return null;
  if (which === "answer") return task.answer;
  if (which === "solution") return task.solution;
  return task.hints[which] ?? null;
}
