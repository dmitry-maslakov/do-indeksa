import { cn } from "cn";
import { useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { positions } from "@/content/exam";

interface TimeRow {
  number: number;
  meanMs: number;
  normMs: number;
}

const list =
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 text-sm";

const ghost = (
  <ul className={list}>
    {[70, 52, 38].map((width) => (
      <li key={width} className="contents">
        <Skeleton className="h-3 w-7" />
        <Skeleton className="h-2" style={{ width: `${width}%` }} />
        <Skeleton className="h-3 w-12" />
      </li>
    ))}
  </ul>
);

export function TimeCard({ rows }: { rows?: TimeRow[] }) {
  const t = useTranslations("Home");

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{t("time")}</CardTitle>
        <CardDescription>
          {t("norm", { minutes: positions[0]?.minutes ?? 0 })}
        </CardDescription>
      </CardHeader>
      {!rows ? (
        ghost
      ) : rows.length === 0 ? (
        <EmptyNote
          text={t("timeEmpty")}
          signedIn
          href="/variants"
          action={t("startTest")}
        />
      ) : (
        <TimeRows rows={rows} />
      )}
    </Card>
  );
}

function TimeRows({ rows }: { rows: TimeRow[] }) {
  const t = useTranslations("Home");
  const top =
    Math.max(...rows.map((r) => Math.max(r.meanMs, r.normMs)), 1) * 1.1;

  return (
    <ul className={list}>
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
  );
}
