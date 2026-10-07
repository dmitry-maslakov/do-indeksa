import "server-only";
import { z } from "zod";
import type { Progress } from "@/lib/progress";
import { levelOf, levels, summarize, tasks } from "./tasks";

export const statusFilters = ["new", "solved", "wrong", "favorite"] as const;

const optional = <T extends z.ZodType>(schema: T) =>
  schema.optional().catch(undefined);

export const bankFiltersSchema = z.object({
  q: optional(z.string().trim().min(1).max(100)),
  number: optional(z.coerce.number().int().positive()),
  topic: optional(z.string().min(1)),
  level: optional(z.enum(levels)),
  sort: optional(z.enum(["easy", "hard"])),
  status: optional(z.enum(statusFilters)),
});

export type BankFilters = z.infer<typeof bankFiltersSchema>;

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
