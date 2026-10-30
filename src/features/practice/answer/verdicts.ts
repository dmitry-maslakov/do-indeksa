import { isRight, type PartOutcome } from "@/db/columns";

export const verdicts = [
  "correct",
  "wrong",
  "unreadable",
  "incomplete",
] as const;

export type Verdict = (typeof verdicts)[number];

export function verdictOf(outcomes: PartOutcome[]): Verdict {
  if (outcomes.every(isRight)) return "correct";
  if (outcomes.includes("wrong")) return "wrong";
  return outcomes.includes("unreadable") ? "unreadable" : "incomplete";
}
