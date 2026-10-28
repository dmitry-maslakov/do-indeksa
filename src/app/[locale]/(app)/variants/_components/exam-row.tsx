import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicGlyph } from "@/features/catalog/topic-icon";
import type { TestSummary } from "@/features/exam/test-summaries";
import { reviewHref } from "@/features/review/review";
import { Link } from "@/i18n/navigation";
import { resultOf, resultTone } from "./results";

export const tableGrid =
  "md:grid-cols-[--spacing(37)_minmax(0,1fr)_--spacing(18)_--spacing(24)] md:gap-5 md:px-6";

const thisYear = (at: number) =>
  new Date(at).getFullYear() === new Date().getFullYear();

interface ExamRowProps {
  title: string;
  href: string;
  kind?: string;
  original?: string;
  test?: TestSummary;
  pending?: boolean;
}

export function ExamRow({
  title,
  href,
  kind,
  original,
  test,
  pending,
}: ExamRowProps) {
  const t = useTranslations("Variants");
  const format = useFormatter();
  const date =
    test &&
    format.dateTime(test.finishedAt, {
      day: "numeric",
      month: "short",
      year: thisYear(test.finishedAt) ? undefined : "numeric",
    });
  const segments = test?.segments ?? [];

  return (
    <li
      className={cn(
        "group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b p-4 text-sm last:border-b-0 hover:bg-muted/50 md:py-2",
        tableGrid,
        test ? "md:min-h-18" : "md:min-h-14",
      )}
    >
      <div className="flex flex-col gap-1 md:block">
        <Link
          href={test ? reviewHref(test.id) : href}
          className="block font-bold text-base tracking-tight outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset md:text-lg"
        >
          {title}
        </Link>
        {pending ? (
          <Skeleton className="h-3 w-16" />
        ) : (
          <small className="text-subtle text-xs">
            {kind
              ? `${kind} · ${date}`
              : date
                ? t("solvedOn", { date })
                : t("notSolved")}
          </small>
        )}
        {original && (
          <a
            href={original}
            target="_blank"
            rel="noopener"
            className="relative block w-fit text-subtle text-xs underline underline-offset-3 hover:text-foreground"
          >
            {t("original")}
          </a>
        )}
      </div>
      {test ? (
        <span
          role="img"
          aria-label={t("cellsLabel", {
            ok: segments.filter((s) => s === "done").length,
            total: segments.length,
          })}
          className="col-span-2 row-start-2 grid grid-cols-10 gap-1 md:col-span-1 md:row-start-auto"
        >
          {test.looks
            .map((look, i) => ({ look, position: i + 1 }))
            .map(({ look, position }) => (
              <span
                key={position}
                className={cn(
                  "flex h-7 items-center justify-center rounded-md font-bold md:h-9 [&_svg]:size-3",
                  resultTone[resultOf(segments[position - 1] ?? "none")],
                )}
              >
                <TopicGlyph icon={look.icon} size="sm" />
              </span>
            ))}
        </span>
      ) : (
        <span className="max-md:hidden" />
      )}
      {test ? (
        <span className="text-right font-bold text-base tabular-nums">
          {test.score}
          <small className="font-medium text-subtle text-xs">
            {" "}
            / {test.max}
          </small>
        </span>
      ) : (
        <span className="max-md:hidden" />
      )}
      {!pending && (
        <span
          className={cn(
            "inline-flex h-8 items-center justify-self-end whitespace-nowrap rounded-lg bg-muted px-4 font-semibold text-sm group-hover:bg-untouched md:h-9",
            test && "max-md:hidden",
          )}
        >
          {test ? t("review") : t("go")}
        </span>
      )}
    </li>
  );
}
