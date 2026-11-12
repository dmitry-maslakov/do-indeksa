import { isRight } from "@/db/columns";
import { type GradedTask, gradeTask } from "@/features/catalog/checker";
import { isAnswered } from "./state";

export function gradeTest(
  tasks: (GradedTask & { taskId: string })[],
  answers: string[][],
) {
  return tasks.map((task, i) => {
    const given = answers[i] ?? [];
    const outcomes = gradeTask(task, given).map((g) => g.outcome);
    return {
      taskId: task.taskId,
      answers: given,
      outcomes,
      correct: outcomes.every(isRight),
      answered: isAnswered(given),
    };
  });
}
