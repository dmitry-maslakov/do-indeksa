import { getTranslations } from "next-intl/server";
import { getFacts } from "@/i18n/facts";

interface FigureProps {
  value: number | null | undefined;
  kind: "count" | "score";
  short: string;
}

export async function Figure({ value, kind, short }: FigureProps) {
  if (value !== null && value !== undefined) {
    const facts = await getFacts();
    return facts[kind](value);
  }
  const t = await getTranslations("Facts");
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{t("unpublished", { short })}</span>
    </>
  );
}

export async function getBound() {
  const [t, facts] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
  ]);
  return (
    b: { over: number } | { atLeast: number },
    unit: "yes" | "no" = "yes",
  ) =>
    "over" in b
      ? t("bound", { kind: "over", points: facts.count(b.over), unit })
      : t("bound", { kind: "atLeast", points: facts.count(b.atLeast), unit });
}
