import "server-only";
import type { inferParserType } from "nuqs/server";
import type { bankParsers, statusFilters } from "@/lib/bank-params";
import type { Progress } from "@/lib/progress";
import { levelOf, summarize, tasks } from "./tasks";

export const bankPage = 30;

export type BankFilters = Partial<inferParserType<typeof bankParsers>>;

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function matchesStatus(
  filter: (typeof statusFilters)[number],
  id: string,
  progress: Progress,
) {
  if (filter === "favorite") return progress.favorites.has(id);
  return (progress.statuses.get(id) ?? "new") === filter;
}

export function searchBank(
  { q, number, topic, level, sort, status }: BankFilters,
  progress?: Progress,
) {
  const query = q && fold(q);
  const order = sort === "hard" ? -1 : sort === "easy" ? 1 : 0;
  return tasks
    .filter((t) => !query || fold(t.text).includes(query))
    .filter((t) => !topic || t.topic === topic)
    .filter((t) => !level || levelOf(t.difficulty) === level)
    .filter(
      (t) => !status || !progress || matchesStatus(status, t.id, progress),
    )
    .map(summarize)
    .filter((t) => !number || t.number === number)
    .sort(
      (a, b) => order * (a.difficulty - b.difficulty) || a.number - b.number,
    );
}
