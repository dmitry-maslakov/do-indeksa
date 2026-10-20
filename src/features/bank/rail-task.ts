import "server-only";
import { escape as escapeHtml } from "es-toolkit";
import katex from "katex";
import type { Progress } from "@/features/progress/status";
import { getTask } from "@/features/tasks/tasks";
import { type ListPage, railPage } from "./rail-page";
import { type BankFilters, findTasks } from "./search";
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

export function listPage(
  filters: BankFilters,
  progress: Progress | undefined,
  { offset, around }: { offset?: number; around?: string },
): ListPage {
  const found = findTasks(filters, progress);
  const at = around ? found.findIndex((t) => t.id === around) : -1;
  const start = offset ?? Math.max(0, at - railPage / 2);
  return {
    start,
    total: found.length,
    rows: found.slice(start, start + railPage).map(({ id }) => ({
      id,
      html: previewHtml(id),
      status: progress?.statuses.get(id),
    })),
  };
}
