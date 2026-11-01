import { isRight } from "@/db/columns";
import { type GradedPart, gradeParts } from "@/features/catalog/checker";
import { isAnswered } from "./state";

interface GradedTask {
  taskId: string;
  parts: GradedPart[];
}

export function gradeTest(tasks: GradedTask[], answers: string[][]) {
  return tasks.map((task, i) => {
    const given = answers[i] ?? [];
    const outcomes = gradeParts(task.parts, given).map((g) => g.outcome);
    return {
      taskId: task.taskId,
      answers: given,
      outcomes,
      correct: outcomes.every(isRight),
      answered: isAnswered(given),
    };
  });
}
