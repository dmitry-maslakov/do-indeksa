import type { useTranslations } from "next-intl";

export const levels = ["easy", "medium", "hard"] as const;

export type Level = (typeof levels)[number];

export const levelOf = (difficulty: number): Level =>
  difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard";

export function taskMeta(
  { number, level }: { number: number | null; level: Level },
  bank: ReturnType<typeof useTranslations<"Bank">>,
) {
  const label = bank("taskLevel", { level });
  return number === null ? label : bank("meta", { number, level: label });
}
