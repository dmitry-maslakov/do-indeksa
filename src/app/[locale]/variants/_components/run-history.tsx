import { useFormatter, useTranslations } from "next-intl";
import { Score } from "@/components/score";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import type { RunSummary } from "@/content/runs";
import { Link } from "@/i18n/navigation";

export function RunHistory({ runs }: { runs: RunSummary[] }) {
  const t = useTranslations("Variants");
  const format = useFormatter();

  if (runs.length === 0) {
    return (
      <Card>
        <p className="text-sm text-subtle">{t("historyEmpty")}</p>
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
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-sm hover:bg-muted/50 md:grid-cols-[150px_minmax(0,1fr)_72px] md:px-6"
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
                className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto"
              />
              <Score value={run.score} max={run.max} className="text-right" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
