import type { Segment } from "@/lib/strip";

export type TaskStatus = "new" | "solved" | "wrong";

export interface Attempted {
  status: Exclude<TaskStatus, "new">;
  at: Date;
  today: boolean;
}

export interface Progress {
  statuses: Map<string, TaskStatus>;
  favorites: Set<string>;
}

const statusSegments: Record<TaskStatus, Segment> = {
  new: "none",
  solved: "done",
  wrong: "error",
};

export const statusSegment = (status: TaskStatus | undefined): Segment =>
  status ? statusSegments[status] : "none";
