import { sumBy } from "es-toolkit";

export interface TaskOutcome {
  taskId: string;
  topic: string;
  wrong: boolean;
  ms: number;
}

export interface TopicMistakes {
  topic: string;
  tasks: number;
  wrong: number;
  meanMs: number;
}

export const mistakeDays = 30;

export function topicMistakes(rows: TaskOutcome[]): TopicMistakes[] {
  return [...Map.groupBy(rows, (row) => row.topic)]
    .map(([topic, tasks]) => ({
      topic,
      tasks: tasks.length,
      wrong: tasks.filter((task) => task.wrong).length,
      meanMs: sumBy(tasks, (task) => task.ms) / tasks.length,
    }))
    .sort(
      (a, b) =>
        b.wrong - a.wrong ||
        b.wrong / b.tasks - a.wrong / a.tasks ||
        b.tasks - a.tasks,
    );
}
