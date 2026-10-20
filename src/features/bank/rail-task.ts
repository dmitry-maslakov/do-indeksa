import "server-only";
import { escape as escapeHtml } from "es-toolkit";
import katex from "katex";
import { getTask } from "@/features/tasks/tasks";
import { examSource } from "./source";

const toHtml = (part: string, index: number) =>
  index % 2
    ? katex.renderToString(part, { throwOnError: false })
    : escapeHtml(part);

const previews = new Map<string, string>();

export function previewHtml(id: string) {
  const cached = previews.get(id);
  if (cached !== undefined) return cached;
  const html = (getTask(id)?.preview ?? "")
    .split(/\$([^$]+)\$/)
    .map(toHtml)
    .join("");
  previews.set(id, html);
  return html;
}

export const examYear = (id: string) => {
  const task = getTask(id);
  return (task && examSource(task.source)?.year) ?? null;
};
