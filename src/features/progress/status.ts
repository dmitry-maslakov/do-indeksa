import type { SessionKind } from "@/db/columns";

export type TaskStatus = "new" | "solved" | "wrong";

export type Answered = Exclude<TaskStatus, "new">;

export type Result = Answered | "revealed";

export type TouchStatus = Result | "skipped" | "opened";

export type TaskStatuses = Map<string, Answered>;

export interface Touch {
  taskId: string;
  from: number;
  to: number;
  kind: SessionKind;
}

export interface Touched {
  touches: Touch[];
  statuses: TaskStatuses;
}

export interface Outcome {
  taskId: string;
  at: number;
  result: Result;
}
