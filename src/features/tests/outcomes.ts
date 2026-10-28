import "server-only";
import katex from "katex";
import { getTask } from "@/features/catalog/tasks";
import type { Outcomes } from "./review";

const latexToHtml = (latex: string) =>
  katex.renderToString(latex, { throwOnError: false, output: "html" });

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
