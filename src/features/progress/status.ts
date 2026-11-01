import type { SessionKind } from "@/db/columns";

export type TaskStatus = "new" | "solved" | "wrong";

export type Answered = Exclude<TaskStatus, "new">;

export type TouchStatus = Answered | "revealed" | "skipped" | "opened";

export const isAnswered = (status?: TouchStatus): status is Answered =>
  status === "solved" || status === "wrong";

export type TaskStatuses = Map<string, Answered>;

export type TouchStatuses = Map<string, TouchStatus>;

export interface Touch {
  taskId: string;
  from: number;
  to: number;
  kind: SessionKind;
}

export interface Touched {
  touches: Touch[];
  statuses: TouchStatuses;
}
