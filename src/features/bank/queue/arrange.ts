import { omit } from "es-toolkit";
import type { Queue } from "./queue";

type Lists = Pick<Queue, "visit" | "upcoming">;

export const sections = ["visit", "upcoming"] as const;

export const listed = (queue: Lists, id: string) =>
  sections.some((key) => queue[key].some((row) => row.id === id));

export function arrange(queue: Lists, current: string): Lists {
  if (queue.visit.some((row) => row.id === current)) return queue;
  const row = queue.upcoming.find((r) => r.id === current);
  if (!row) return queue;
  return {
    visit: [...queue.visit, omit(row, ["repeat", "reason"])],
    upcoming: queue.upcoming.filter((r) => r.id !== current),
  };
}

export const shownUpcoming = 3;

export function progressOf({ visit }: Lists, current: string) {
  const index = visit.findIndex((row) => row.id === current);
  if (index < 0) return undefined;
  return {
    position: index + 1,
    done: index,
    right: visit.slice(0, index).filter((row) => row.status === "solved")
      .length,
  };
}
