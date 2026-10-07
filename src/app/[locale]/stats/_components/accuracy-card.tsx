import { cn } from "cn";
import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/progress-bar";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { type Accuracy, SAMPLE_MIN } from "@/lib/stats";

interface AccuracyCardProps {
  rows: (Accuracy & { label: string })[];
  byNumber: boolean;
}

export function AccuracyCard({ rows, byNumber }: AccuracyCardProps) {
  const t = useTranslations("Stats");
  const tab = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-1.5 font-medium text-sm transition-colors",
      active
        ? "bg-card text-foreground shadow-sm"
        : "text-subtle hover:text-foreground",
    );

  return (
    <Card className="gap-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">{t("weaker")}</h2>
        <nav className="flex gap-1 rounded-xl bg-muted p-1">
          <Link
            href="/stats"
            className={tab(!byNumber)}
            aria-current={!byNumber ? "page" : undefined}
          >
            {t("topics")}
          </Link>
          <Link
            href="/stats?by=number"
            className={tab(byNumber)}
            aria-current={byNumber ? "page" : undefined}
          >
            {t("numbers")}
          </Link>
        </nav>
      </div>
      <ul className="grid grid-cols-[104px_minmax(0,1fr)_40px] items-center gap-x-4 gap-y-2.5 text-sm md:grid-cols-[170px_minmax(0,1fr)_44px_92px]">
        {rows.map((row) => (
          <li key={row.key} className="contents">
            <span className={cn("truncate", row.pct === null && "text-subtle")}>
              {row.label}
            </span>
            <span>
              <ProgressBar value={(row.pct ?? 0) / 100} />
            </span>
            <b
              className={cn("font-semibold", row.pct === null && "text-subtle")}
            >
              {row.pct === null ? "—" : `${row.pct}%`}
            </b>
            <span className="hidden text-subtle md:block">
              {t("attempts", { count: row.total })}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-subtle">
        {t("sample", { count: SAMPLE_MIN })}
      </p>
    </Card>
  );
}
