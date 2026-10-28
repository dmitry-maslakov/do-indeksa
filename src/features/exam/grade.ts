import { gradeParts } from "@/lib/math";
import { isRight } from "@/lib/part-outcome";
import { isAnswered } from "./test-state";

interface GradedTask {
  taskId: string;
  expected: string[];
}

export function gradeTest(tasks: GradedTask[], answers: string[][]) {
  return tasks.map((task, i) => {
    const given = answers[i] ?? [];
    const outcomes = gradeParts(task.expected, given);
    return {
      taskId: task.taskId,
      answers: given,
      outcomes,
      correct: outcomes.every(isRight),
      answered: isAnswered(given),
    };
  });
}
