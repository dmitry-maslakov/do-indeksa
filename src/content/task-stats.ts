import "server-only";
import { numberOf } from "@/features/exam/exam";
import { getTask } from "@/features/tasks/tasks";
import type { TaskStat } from "@/lib/stats";

type TaskTotals = Omit<TaskStat, "number" | "topic">;

export function taskStats(rows: TaskTotals[]): TaskStat[] {
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task
      ? { ...row, topic: task.topic, number: numberOf(task.topic) }
      : [];
  });
}
