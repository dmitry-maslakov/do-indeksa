"use server";

import { z } from "zod";
import { renderTask } from "@/content/tasks";

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
  const html = await renderTask(z.string().parse(taskId));
  const which = partSchema.parse(part);
  if (!html) return null;
  if (which === "answer") return html.answer;
  if (which === "solution") return html.solution;
  return html.hints[which] ?? null;
}
