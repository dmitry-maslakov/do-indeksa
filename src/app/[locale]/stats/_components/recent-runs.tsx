import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import type { Segment } from "@/lib/strip";

interface RecentRun {
  id: string;
  title: string;
  segments: Segment[];
  score: number;
}

export function RecentRuns({ runs }: { runs: RecentRun[] }) {
  const t = useTranslations("Stats");

  return (
    <Card className="gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-lg">{t("recent")}</h2>
        <Link
          href="/variants"
          className="text-sm text-subtle hover:text-foreground"
        >
          {t("all")}
        </Link>
      </div>
      {runs.length === 0 ? (
        <p className="text-sm text-subtle">{t("noRuns")}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {runs.map((run) => (
            <li key={run.id}>
              <Link
                href={`/review?run=${run.id}`}
                className="grid grid-cols-[96px_minmax(0,1fr)_28px] items-center gap-3 rounded-lg py-1.5 hover:bg-muted/50"
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
    </Card>
  );
}
