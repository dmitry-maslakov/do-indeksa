import "server-only";
import { memoize, orderBy } from "es-toolkit";
import type { inferParserType } from "nuqs/server";
import { examSource } from "@/features/catalog/source";
import { summarize, type TaskSummary, tasks } from "@/features/catalog/tasks";
import type { TaskStatuses } from "@/features/progress/status";
import { fold } from "@/lib/text";
import type { bankParsers } from "./params";

export type BankQuery = Partial<inferParserType<typeof bankParsers>>;

interface Entry {
  summary: TaskSummary;
  text: string;
  exam: boolean;
}

const ordersOf = memoize((examId: string) => {
  const entries: Entry[] = tasks.map((task) => ({
    summary: summarize(examId, task),
    text: fold(`${task.id} ${task.text} ${task.source}`),
    exam: examSource(task.source) !== null,
  }));
  const sortedBy = (order: -1 | 0 | 1) =>
    orderBy(
      entries,
      [(e) => order * e.summary.difficulty, (e) => e.summary.number],
      ["asc"],
    );
  return { number: sortedBy(0), easy: sortedBy(1), hard: sortedBy(-1) };
});

export function searchBank(
  examId: string,
  { q, number, topic, source, level, sort }: BankQuery,
) {
  const query = q && fold(q);
  const sorted = ordersOf(examId)[sort ?? "number"];
  return sorted
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

export const findTasks = (
  examId: string,
  filters: BankQuery,
  statuses?: TaskStatuses,
) => filterByStatus(searchBank(examId, filters), filters.status, statuses);
