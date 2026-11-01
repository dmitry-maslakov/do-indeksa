import type { RevealPart } from "./reveals";

export const isHint = (part: RevealPart): part is number =>
  typeof part === "number";

export function helpOf(opened: RevealPart[]) {
  return {
    hints: opened.filter(isHint).length,
    shown: opened.find((part) => typeof part === "string"),
    solution: opened.includes("solution"),
  };
}

export const cardsOf = (opened: RevealPart[], answerText: boolean) =>
  opened.filter(
    (part) => part !== "answer" || (answerText && !opened.includes("solution")),
  );

interface Ladder {
  opened: RevealPart[];
  hintCount: number;
  correct: boolean;
}

export function offered({ opened, hintCount, correct }: Ladder): RevealPart[] {
  if (opened.includes("solution")) return [];
  if (correct || opened.includes("answer")) return ["solution"];
  const { hints } = helpOf(opened);
  return hints < hintCount
    ? [hints, "answer", "solution"]
    : ["answer", "solution"];
}
