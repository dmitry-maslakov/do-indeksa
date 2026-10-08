import { DAY } from "./dates";
import { gradeParts } from "./math";
import { creditOf } from "./review";
import { isAnswered } from "./run";

interface GradedTask {
  taskId: string;
  expected: string[];
  points: number;
}

export function gradeRun(
  tasks: GradedTask[],
  answers: string[][],
  durations: number[],
) {
  return tasks.map((task, i) => {
    const given = answers[i] ?? [];
    const parts = gradeParts(task.expected, given);
    return {
      taskId: task.taskId,
      answers: given,
      parts,
      correct: parts.every(Boolean),
      answered: isAnswered(given),
      durationMs: Math.min(durations[i] ?? 0, DAY),
      points: creditOf(parts, task.points),
    };
  });
}
