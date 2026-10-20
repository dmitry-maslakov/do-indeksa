import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { RunSummary } from "@/features/exam/run-summaries";
import { reviewHref } from "@/features/review/review";
import { TopicGlyph } from "@/features/tasks/topic-icon";
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
  run?: RunSummary;
  pending?: boolean;
}

export function ExamRow({ title, href, kind, run, pending }: ExamRowProps) {
  const t = useTranslations("Variants");
  const format = useFormatter();
  const date =
    run &&
    format.dateTime(run.finishedAt, {
      day: "numeric",
      month: "short",
      year: thisYear(run.finishedAt) ? undefined : "numeric",
    });
  const segments = run?.segments ?? [];

  return (
    <li className="border-b last:border-b-0">
      <Link
        href={run ? reviewHref(run.id) : href}
        className={cn(
          "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-4 text-sm hover:bg-muted/50 md:py-0",
          tableGrid,
          run ? "md:min-h-18" : "md:min-h-14",
        )}
      >
        <div className="flex flex-col gap-1 md:block">
          <b className="block font-bold text-base tracking-tight md:text-lg">
            {title}
          </b>
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
        </div>
        {run ? (
          <span
            role="img"
            aria-label={t("cellsLabel", {
              ok: segments.filter((s) => s === "done").length,
              total: segments.length,
            })}
            className="col-span-2 row-start-2 grid grid-cols-10 gap-1 md:col-span-1 md:row-start-auto"
          >
            {run.looks
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
        {run ? (
          <span className="text-right font-bold text-base tabular-nums">
            {run.score}
            <small className="font-medium text-subtle text-xs">
              {" "}
              / {run.max}
            </small>
          </span>
        ) : (
          <span className="max-md:hidden" />
        )}
        {!pending && (
          <span
            className={cn(
              "inline-flex h-8 items-center justify-self-end whitespace-nowrap rounded-lg bg-muted px-4 font-semibold text-sm group-hover:bg-untouched md:h-9",
              run && "max-md:hidden",
            )}
          >
            {run ? t("review") : t("go")}
          </span>
        )}
      </Link>
    </li>
  );
}
