import "server-only";
import { latexToHtml } from "@/lib/latex";
import type { Outcomes } from "@/lib/review";
import { getTask } from "./tasks";

export function outcomesOf(
  attempts: { taskId: string; answers: string[] }[],
): Outcomes {
  const outcomes: Outcomes = {};
  for (const { taskId, answers } of attempts) {
    const [key, ...rest] = getTask(taskId)?.check ?? [];
    if (key && rest.length === 0) {
      outcomes[taskId] = {
        given: latexToHtml(answers[0] ?? ""),
        key: latexToHtml(key.expected),
      };
    }
  }
  return outcomes;
}
