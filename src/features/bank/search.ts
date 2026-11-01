import "server-only";
import { deburr, orderBy } from "es-toolkit";
import type { inferParserType } from "nuqs/server";
import { examSource } from "@/features/catalog/source";
import { summarize, type TaskSummary, tasks } from "@/features/catalog/tasks";
import type { TaskStatuses } from "@/features/progress/status";
import type { bankParsers } from "./params";

export type BankQuery = Partial<inferParserType<typeof bankParsers>>;

const fold = (s: string) => deburr(s).toLowerCase();

interface Entry {
  summary: TaskSummary;
  text: string;
  exam: boolean;
}

const entries: Entry[] = tasks.map((task) => ({
  summary: summarize(task),
  text: fold(`${task.id} ${task.text} ${task.source}`),
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

export function filterByStatus(
  found: TaskSummary[],
  status: BankQuery["status"],
  statuses?: TaskStatuses,
) {
  if (!status || !statuses) return found;
  return found.filter((t) => (statuses.get(t.id) ?? "new") === status);
}

export const findTasks = (filters: BankQuery, statuses?: TaskStatuses) =>
  filterByStatus(searchBank(filters), filters.status, statuses);
