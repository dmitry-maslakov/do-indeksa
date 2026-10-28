import "server-only";
import { deburr, orderBy } from "es-toolkit";
import type { inferParserType } from "nuqs/server";
import { summarize, type TaskSummary, tasks } from "@/features/catalog/tasks";
import type { Progress } from "@/features/progress/status";
import type { bankParsers, statusFilters } from "./params";
import { examSource } from "./source";

export type BankQuery = Partial<inferParserType<typeof bankParsers>>;

const fold = (s: string) => deburr(s).toLowerCase();

interface Entry {
  summary: TaskSummary;
  text: string;
  exam: boolean;
}

const entries: Entry[] = tasks.map((task) => ({
  summary: summarize(task),
  text: fold(`${task.text} ${task.source}`),
  exam: examSource(task.source) !== null,
}));

const sortedBy = (order: -1 | 0 | 1) =>
  orderBy(
    entries,
    [(e) => order * e.summary.difficulty, (e) => e.summary.number],
    ["asc"],
  );

const orders = { number: sortedBy(0), easy: sortedBy(1), hard: sortedBy(-1) };

export function searchBank({
  q,
  number,
  topic,
  source,
  level,
  sort,
}: BankQuery) {
  const query = q && fold(q);
  return orders[sort ?? "number"]
    .filter(
      ({ summary, text, exam }) =>
        (!query || text.includes(query)) &&
        (!topic || summary.topic === topic) &&
        (!source || exam === (source === "exam")) &&
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
  status: BankQuery["status"],
  progress?: Progress,
) {
  if (!status || !progress) return found;
  return found.filter((t) => matchesStatus(status, t.id, progress));
}

export const findTasks = (filters: BankQuery, progress?: Progress) =>
  filterByStatus(searchBank(filters), filters.status, progress);
