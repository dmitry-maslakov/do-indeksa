import { creditOf } from "@/features/review/review";
import { dayMs } from "@/lib/dates";
import { gradeParts } from "@/lib/math";
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
      durationMs: Math.min(durations[i] ?? 0, dayMs),
      points: creditOf(parts, task.points),
    };
  });
}
