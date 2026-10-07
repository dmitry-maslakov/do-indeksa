import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { RunSummary } from "@/content/runs";
import { Link } from "@/i18n/navigation";

export function RecentCard({ runs }: { runs: RunSummary[] }) {
  const t = useTranslations("Variants");

  return (
    <Card className="gap-3">
      <span className="font-semibold text-sm text-subtle">{t("recent")}</span>
      <ul className="flex flex-col gap-2 text-sm">
        {runs.map((run) => (
          <li key={run.id}>
            <Link
              href={`/review?run=${run.id}`}
              className="flex justify-between gap-3 hover:text-data"
            >
              <span className="truncate">{run.title}</span>
              <b className="font-semibold">
                {run.score} / {run.max}
              </b>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
