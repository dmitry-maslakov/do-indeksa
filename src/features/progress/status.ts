export type TaskStatus = "new" | "solved" | "wrong";

export interface Touched {
  status?: Exclude<TaskStatus, "new">;
  at: Date;
  today: boolean;
}

export interface Progress {
  statuses: Map<string, TaskStatus>;
  favorites: Set<string>;
}
