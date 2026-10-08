import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { Score } from "@/components/score";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VariantStrip } from "@/components/variant-strip";
import type { RunSummary } from "@/content/runs";
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

export function RunHistory({ runs }: { runs?: RunSummary[] }) {
  const t = useTranslations("Variants");
  const home = useTranslations("Home");
  const format = useFormatter();

  if (!runs) return <Card className="p-0 md:p-0">{ghost}</Card>;

  if (runs.length === 0) {
    return (
      <Card className="p-0 pb-6 md:p-0 md:pb-7">
        <EmptyNote
          className="*:last:px-5 md:*:last:px-6"
          ghost={ghost}
          text={t("historyEmpty")}
          signedIn
          href="/variants/daily"
          action={home("playDaily")}
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 md:p-0">
      <ul className="divide-y divide-subtle/15 py-1.5">
        {runs.map((run) => (
          <li key={run.id}>
            <Link
              href={`/review?run=${run.id}`}
              className={cn(row, "hover:bg-muted/50")}
            >
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
        ))}
      </ul>
    </Card>
  );
}
