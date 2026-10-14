import "server-only";
import { renderTask } from "./tasks";

export type RevealPart = "answer" | "solution" | number;

export async function revealPart(taskId: string, part: RevealPart) {
  const html = await renderTask(taskId);
  if (!html) return null;
  if (part === "answer") return html.answer;
  if (part === "solution") return html.solution;
  return html.hints[part] ?? null;
}
