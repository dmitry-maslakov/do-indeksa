import "server-only";
import katex from "katex";
import { isBoxKind } from "@/features/catalog/boxes";
import { pickedOf } from "@/features/catalog/choice";
import { isYesNo, type Kind, kindOf } from "@/features/catalog/kinds";
import { getTask } from "@/features/catalog/tasks";
import type { PartAnswer, TaskAnswers } from "./review";

const macros = {
  "\\tg": "\\operatorname{tg}",
  "\\ctg": "\\operatorname{ctg}",
  "\\arctg": "\\operatorname{arctg}",
};

const latexToHtml = (latex: string) =>
  katex.renderToString(latex, {
    throwOnError: false,
    output: "html",
    macros,
  });

function partAnswer(
  check: { expected: string; kind?: Kind | null },
  given: string | undefined,
): PartAnswer {
  const kind = kindOf(check);
  if (kind === "yesno" && isYesNo(check.expected))
    return {
      key: { yesno: check.expected },
      given: given && isYesNo(given) ? { yesno: given } : undefined,
    };
  const shown = (latex: string) => ({
    html: latexToHtml(isBoxKind(kind) ? latex.replaceAll(";", ", ") : latex),
  });
  return {
    key: shown(check.expected),
    given: given ? shown(given) : undefined,
  };
}

function answersOfTask(taskId: string, given: string[] = []): PartAnswer[] {
  const task = getTask(taskId);
  if (task?.choice) {
    const picked = pickedOf(given);
    return [
      {
        key: { letters: task.choice.correct },
        given: picked.length ? { letters: picked } : undefined,
      },
    ];
  }
  return (task?.check ?? []).map((check, i) =>
    partAnswer(check, given[i]?.trim() || undefined),
  );
}

export function answersOf(
  taskIds: string[],
  attempts: { taskId: string; answers: string[] }[],
): TaskAnswers {
  const given = new Map(attempts.map((a) => [a.taskId, a.answers]));
  return Object.fromEntries(
    taskIds.map((taskId) => [taskId, answersOfTask(taskId, given.get(taskId))]),
  );
}
