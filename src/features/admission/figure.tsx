import { cn } from "cn";
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

export const figureNote =
  "block whitespace-nowrap text-subtle text-xs leading-3.5";

interface PairCellProps {
  pair?: { budget?: number | null; self?: number | null };
  kind: FigureProps["kind"];
  short: string;
  className?: string;
}

export async function PairCell({
  pair,
  kind,
  short,
  className,
}: PairCellProps) {
  const [t, unpublished] = await Promise.all([
    getTranslations("Faculty"),
    getTranslations("Facts"),
  ]);
  const missing = pair?.budget === null || pair?.self === null;
  return (
    <td className={cn(className, "lg:grid lg:grid-cols-2 lg:gap-x-4")}>
      <span className="block whitespace-nowrap lg:contents">
        <span>
          <span className="sr-only">{t("budget")} </span>
          <Figure value={pair?.budget} kind={kind} short={short} />
        </span>
        <span aria-hidden="true" className="whitespace-pre lg:hidden">
          {" / "}
        </span>
        <span className="text-muted-foreground">
          <span className="sr-only">{t("srSelf")} </span>
          <Figure value={pair?.self} kind={kind} short={short} />
        </span>
      </span>
      <span aria-hidden="true" className={cn(figureNote, "lg:hidden")}>
        {t("pairKey")}
      </span>
      {missing && (
        <span aria-hidden="true" className={cn(figureNote, "lg:col-start-2")}>
          {unpublished("unpublished", { short })}
        </span>
      )}
    </td>
  );
}
