import "server-only";
import { numberOf } from "@/features/catalog/exams";
import { getTask } from "@/features/catalog/tasks";
import type { TaskStat } from "./stats";

type TaskTotals = Omit<TaskStat, "number" | "topic">;

export function taskStats(rows: TaskTotals[]): TaskStat[] {
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task
      ? { ...row, topic: task.topic, number: numberOf(task.topic) }
      : [];
  });
}
