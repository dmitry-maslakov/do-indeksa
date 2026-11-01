import "server-only";
import katex from "katex";
import { isBoxKind } from "@/features/catalog/boxes";
import { kindOf } from "@/features/catalog/kinds";
import { getTask } from "@/features/catalog/tasks";
import type { Comparisons } from "./review";

const latexToHtml = (latex: string) =>
  katex.renderToString(latex, { throwOnError: false, output: "html" });

export function comparisonsOf(
  attempts: { taskId: string; answers: string[] }[],
): Comparisons {
  const comparisons: Comparisons = {};
  for (const { taskId, answers } of attempts) {
    const [key, ...rest] = getTask(taskId)?.check ?? [];
    if (key && rest.length === 0) {
      const given = answers[0] ?? "";
      comparisons[taskId] = {
        given: latexToHtml(
          isBoxKind(kindOf(key)) ? given.replaceAll(";", ", ") : given,
        ),
        key: latexToHtml(key.expected),
      };
    }
  }
  return comparisons;
}
