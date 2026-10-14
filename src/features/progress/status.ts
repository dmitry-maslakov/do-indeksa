export type TaskStatus = "new" | "solved" | "wrong";

export interface Progress {
  statuses: Map<string, TaskStatus>;
  favorites: Set<string>;
}
