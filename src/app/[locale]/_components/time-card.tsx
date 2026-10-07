import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { positions } from "@/content/exam";
import { EmptyNote } from "./empty-note";

interface TimeRow {
  number: number;
  meanMs: number;
  normMs: number;
}

export function TimeCard({
  rows,
  signedIn,
}: {
  rows: TimeRow[];
  signedIn: boolean;
}) {
  const t = useTranslations("Home");
  const norm = positions[0]?.minutes ?? 0;
  const top =
    Math.max(...rows.map((r) => Math.max(r.meanMs, r.normMs)), 1) * 1.1;

  return (
    <Card className="gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-lg">{t("time")}</h2>
        <span className="text-sm text-subtle">
          {t("norm", { minutes: norm })}
        </span>
      </div>
      {rows.length === 0 && (
        <EmptyNote
          text={t("timeEmpty")}
          signedIn={signedIn}
          href="/variants"
          action={t("startTest")}
        />
      )}
      <ul className="empty:hidden grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 text-sm">
        {rows.map((row) => {
          const over = row.meanMs > row.normMs;
          return (
            <li key={row.number} className="contents">
              <span>№{row.number}</span>
              <span className="relative h-2 rounded-full bg-untouched">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    over ? "bg-overtime" : "bg-subtle/50",
                  )}
                  style={{ width: `${(row.meanMs / top) * 100}%` }}
                />
                <span
                  className="absolute -top-1 h-4 w-px bg-foreground/60"
                  style={{ left: `${(row.normMs / top) * 100}%` }}
                />
              </span>
              <span
                className={cn(
                  "font-semibold",
                  over ? "text-overtime-text" : "text-subtle",
                )}
              >
                {t("minutes", { minutes: Math.round(row.meanMs / 60_000) })}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
