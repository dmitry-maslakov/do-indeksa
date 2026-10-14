"use client";

import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { LoadMore } from "@/components/load-more";
import { Score } from "@/components/score";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VariantStrip } from "@/components/variant-strip";
import type { RunPage } from "@/features/exam/run-feed";
import type { RunSummary } from "@/features/exam/run-summaries";
import { useRunFeed } from "@/features/exam/use-run-feed";
import { reviewHref } from "@/features/review/review";
import { Link } from "@/i18n/navigation";

const row =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-sm md:grid-cols-[150px_minmax(0,1fr)_72px] md:px-6";
const strip = "col-span-2 row-start-2 md:col-span-1 md:row-start-auto";

const ghost = (
  <ul className="divide-y divide-subtle/15 py-1.5">
    {[1, 2, 3].map((n) => (
      <li key={n} className={row}>
        <span className="flex flex-col gap-2 py-0.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </span>
        <Skeleton className={cn("h-2", strip)} />
        <Skeleton className="ml-auto h-3 w-12" />
      </li>
    ))}
  </ul>
);

export function RunHistory({ first }: { first?: RunPage }) {
  const t = useTranslations("Variants");
  const home = useTranslations("Home");

  if (!first) return <Card className="p-0 md:p-0">{ghost}</Card>;

  if (first.runs.length === 0) {
    return (
      <Card>
        <EmptyNote
          text={t("historyEmpty")}
          signedIn
          href="/daily"
          action={home("playDaily")}
        />
      </Card>
    );
  }

  return <RunFeed first={first} />;
}

function RunRow({ run }: { run: RunSummary }) {
  const t = useTranslations("Variants");
  const format = useFormatter();

  return (
    <li>
      <Link href={reviewHref(run.id)} className={cn(row, "hover:bg-muted/50")}>
        <span className="flex flex-col">
          <span className="truncate font-semibold">{run.title}</span>
          <span className="text-subtle text-xs">
            {format.dateTime(run.finishedAt, {
              day: "numeric",
              month: "long",
            })}
          </span>
        </span>
        <VariantStrip
          segments={run.segments}
          label={t("strip", { count: run.segments.length })}
          className={strip}
        />
        <Score value={run.score} max={run.max} className="text-right" />
      </Link>
    </li>
  );
}

function RunFeed({ first }: { first: RunPage }) {
  const t = useTranslations("Bank");
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useRunFeed(first);

  return (
    <>
      <Card className="p-0 md:p-0">
        <ul className="divide-y divide-subtle/15 py-1.5">
          {data.pages
            .flatMap((page) => page.runs)
            .map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
        </ul>
      </Card>
      {hasNextPage && (
        <LoadMore
          key={data.pages.length}
          pending={isFetchingNextPage}
          onLoad={() => fetchNextPage({ cancelRefetch: false })}
        >
          {t("more")}
        </LoadMore>
      )}
    </>
  );
}
