import "server-only";
import type { inferParserType } from "nuqs/server";
import type { bankParsers, statusFilters } from "@/lib/bank-params";
import type { Progress } from "@/lib/progress";
import { summarize, type TaskSummary, tasks } from "./tasks";

export const bankPage = 30;

export type BankFilters = Partial<inferParserType<typeof bankParsers>>;

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

interface Entry {
  summary: TaskSummary;
  text: string;
}

const entries: Entry[] = tasks.map((task) => ({
  summary: summarize(task),
  text: fold(task.text),
}));

const sortedBy = (order: -1 | 0 | 1) =>
  entries.toSorted(
    (a, b) =>
      order * (a.summary.difficulty - b.summary.difficulty) ||
      a.summary.number - b.summary.number,
  );

const orders = { number: sortedBy(0), easy: sortedBy(1), hard: sortedBy(-1) };

export function searchBank({ q, number, topic, level, sort }: BankFilters) {
  const query = q && fold(q);
  return orders[sort ?? "number"]
    .filter(
      ({ summary, text }) =>
        (!query || text.includes(query)) &&
        (!topic || summary.topic === topic) &&
        (!level || summary.level === level) &&
        (!number || summary.number === number),
    )
    .map(({ summary }) => summary);
}

function matchesStatus(
  filter: (typeof statusFilters)[number],
  id: string,
  progress: Progress,
) {
  if (filter === "favorite") return progress.favorites.has(id);
  return (progress.statuses.get(id) ?? "new") === filter;
}

export function filterByStatus(
  found: TaskSummary[],
  status: BankFilters["status"],
  progress?: Progress,
) {
  if (!status || !progress) return found;
  return found.filter((t) => matchesStatus(status, t.id, progress));
}
