import "server-only";
import type { StatAttempt } from "@/lib/stats";
import { numberOf } from "./exam";
import { getTask } from "./tasks";

interface AttemptRow {
  taskId: string;
  correct: boolean;
  durationMs: number;
  createdAt: Date;
}

export function statAttempts(rows: AttemptRow[]): StatAttempt[] {
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task
      ? { ...row, topic: task.topic, number: numberOf(task.topic) }
      : [];
  });
}
