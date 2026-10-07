import "server-only";
import { allExams, allTasks, allTopics, type Task } from "content-collections";
import type { Locale } from "next-intl";
import type { Progress } from "./progress";

export const levels = ["easy", "medium", "hard"] as const;
export const statusFilters = ["new", "solved", "wrong", "favorite"] as const;
export type Level = (typeof levels)[number];

const exam = allExams.find((e) => e.id === "ftn-p1");
if (!exam) throw new Error("exam ftn-p1 is missing");

export const positions = exam.positions;

const levelOf = (difficulty: number): Level =>
  difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard";

const numberOf = new Map(positions.map((p) => [p.topic, p.number]));

export function topicName(id: string, locale: Locale) {
  return allTopics.find((t) => t.id === id)?.name[locale] ?? id;
}

export interface TaskSummary {
  id: string;
  number: number;
  topic: string;
  difficulty: number;
  level: Level;
  statement: string;
}

function summarize(task: Task): TaskSummary {
  return {
    id: task.id,
    number: numberOf.get(task.topic) ?? 0,
    topic: task.topic,
    difficulty: task.difficulty,
    level: levelOf(task.difficulty),
    statement: task.statement,
  };
}

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export interface TaskFilters {
  q?: string;
  number?: number;
  topic?: string;
  level?: Level;
  sort?: "easy" | "hard";
  status?: (typeof statusFilters)[number];
}

export function findTasks(
  { q, number, topic, level, sort, status }: TaskFilters,
  progress?: Progress,
) {
  const query = q && fold(q);
  const found = allTasks
    .filter((t) => !query || fold(t.text).includes(query))
    .filter((t) => !topic || t.topic === topic)
    .filter((t) => !level || levelOf(t.difficulty) === level)
    .filter(
      (t) => !status || !progress || matchesStatus(status, t.id, progress),
    )
    .map(summarize)
    .filter((t) => !number || t.number === number);
  const order = sort === "hard" ? -1 : sort === "easy" ? 1 : 0;
  return found.sort(
    (a, b) => order * (a.difficulty - b.difficulty) || a.number - b.number,
  );
}

function matchesStatus(
  filter: NonNullable<TaskFilters["status"]>,
  id: string,
  progress: Progress,
) {
  if (filter === "favorite") return progress.favorites.has(id);
  return (progress.statuses.get(id) ?? "new") === filter;
}
