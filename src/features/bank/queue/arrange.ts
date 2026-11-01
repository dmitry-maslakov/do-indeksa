import { omit } from "es-toolkit";
import type { Queue } from "./queue";

type Lists = Pick<Queue, "visit" | "upcoming">;

export function arrange(queue: Lists, current: string): Lists {
  if (queue.visit.some((row) => row.id === current)) return queue;
  const row = queue.upcoming.find((r) => r.id === current);
  if (!row) return queue;
  return {
    visit: [...queue.visit, omit(row, ["repeat", "reason"])],
    upcoming: queue.upcoming.filter((r) => r.id !== current),
  };
}
