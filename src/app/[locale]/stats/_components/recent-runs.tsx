import { cn } from "cn";
import { useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import type { Segment } from "@/lib/strip";

interface RecentRun {
  id: string;
  title: string;
  segments: Segment[];
  misses: number[];
  score: number;
}

const row = "grid grid-cols-[96px_minmax(0,1fr)_28px] items-center gap-3";

const ghost = (
  <ul className="flex flex-col gap-1">
    {[1, 2, 3].map((n) => (
      <li key={n} className={cn(row, "py-2")}>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-2" />
        <Skeleton className="h-3" />
      </li>
    ))}
  </ul>
);

export function RecentRuns({ runs }: { runs?: RecentRun[] }) {
  const t = useTranslations("Stats");
  const home = useTranslations("Home");
  const done = runs ?? [];
  const repeated = [...new Set(done.flatMap((r) => r.misses))]
    .filter((n) => done.filter((r) => r.misses.includes(n)).length > 1)
    .sort((a, b) => a - b);

  return (
    <Card className="gap-3.5">
      <CardHeader>
        <CardTitle>{t("recent")}</CardTitle>
        <Link
          href="/variants"
          className="text-sm text-subtle hover:text-foreground"
        >
          {t("all")}
        </Link>
      </CardHeader>
      {!runs ? (
        ghost
      ) : runs.length === 0 ? (
        <EmptyNote
          ghost={ghost}
          text={t("noRuns")}
          signedIn
          href="/variants/daily"
          action={home("playDaily")}
        />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {runs.map((run) => (
            <li key={run.id}>
              <Link
                href={`/review?run=${run.id}`}
                className={cn(row, "rounded-lg py-1.5 hover:bg-muted/50")}
              >
                <span className="truncate font-semibold">{run.title}</span>
                <VariantStrip
                  segments={run.segments}
                  label={t("score", { score: run.score })}
                />
                <b className="text-right font-semibold">{run.score}</b>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {repeated.length > 0 && (
        <p className="text-[13px] text-subtle">
          {t("repeated", { numbers: repeated.join(", ") })}
        </p>
      )}
    </Card>
  );
}
