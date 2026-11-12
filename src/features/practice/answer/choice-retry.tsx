"use client";

import { useTranslations } from "next-intl";
import type { PartOutcome } from "@/db/columns";
import {
  lettersOf,
  pickedOf,
  pickOf,
  type RenderedChoice,
} from "@/features/catalog/choice";

export function ChoiceRetry({
  choice,
  value,
  outcomes,
}: {
  choice: RenderedChoice;
  value: string[];
  outcomes: PartOutcome[];
}) {
  const t = useTranslations("Choice");
  const picked = pickedOf(value);
  const marks = lettersOf(choice.options).map((letter, i) => ({
    marked: picked.includes(letter),
    outcome: outcomes[i],
  }));
  const count = (marked: boolean, outcome: PartOutcome) =>
    marks.filter((m) => m.marked === marked && m.outcome === outcome).length;
  const right = count(true, "right");
  return t("retry", {
    pick: pickOf(choice),
    right,
    wrong: count(true, "wrong"),
    total: right + count(false, "wrong"),
  });
}
