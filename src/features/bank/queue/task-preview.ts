import "server-only";
import { escape as escapeHtml } from "es-toolkit";
import katex from "katex";
import { LRUCache } from "lru-cache";
import { examSource } from "@/features/catalog/source";
import { getTask } from "@/features/catalog/tasks";

const toHtml = (part: string, index: number) =>
  index % 2
    ? katex.renderToString(part, { throwOnError: false, output: "html" })
    : escapeHtml(part);

const previews = new LRUCache<string, string>({
  maxSize: 4 * 1024 * 1024,
  sizeCalculation: (html) => html.length + 1,
});

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
