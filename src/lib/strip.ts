import type { TaskStatus } from "./progress";

export type Segment = "none" | "done" | "error" | "partial" | "current";

export function segmentOf(parts: boolean[] | undefined): Segment {
  if (!parts || parts.length === 0) return "none";
  const right = parts.filter(Boolean).length;
  if (right === parts.length) return "done";
  return right === 0 ? "error" : "partial";
}

const statusSegments: Record<TaskStatus, Segment> = {
  new: "none",
  solved: "done",
  wrong: "error",
};

export const statusSegment = (status: TaskStatus | undefined): Segment =>
  status ? statusSegments[status] : "none";
