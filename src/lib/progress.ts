export type TaskStatus = "new" | "solved" | "wrong";

export interface Progress {
  statuses: Map<string, TaskStatus>;
  favorites: Set<string>;
}

export interface AttemptResult {
  taskId: string;
  correct: boolean;
}

export function latestStatuses(
  newestFirst: AttemptResult[],
): Map<string, TaskStatus> {
  const statuses = new Map<string, TaskStatus>();
  for (const { taskId, correct } of newestFirst) {
    if (!statuses.has(taskId))
      statuses.set(taskId, correct ? "solved" : "wrong");
  }
  return statuses;
}
