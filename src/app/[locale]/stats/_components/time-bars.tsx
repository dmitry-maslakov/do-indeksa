import { cn } from "cn";
import { useTranslations } from "next-intl";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Bar {
  number: number;
  meanMs: number | null;
  normMs: number;
}

export function TimeBars({ bars }: { bars: Bar[] }) {
  const t = useTranslations("Stats");
  const top =
    Math.max(...bars.map((b) => Math.max(b.meanMs ?? 0, b.normMs))) * 1.15 || 1;
  const norm = Math.round((bars[0]?.normMs ?? 0) / 60_000);
  const over = bars.filter((b) => (b.meanMs ?? 0) > b.normMs);

  return (
    <Card size="lg" className="gap-4">
      <CardHeader>
        <CardTitle>{t("time")}</CardTitle>
        <CardDescription>{t("timeNote", { norm })}</CardDescription>
      </CardHeader>
      <div className="relative grid h-28 grid-cols-10 items-end gap-1.5">
        <span
          className="absolute inset-x-0 h-px bg-foreground/35"
          style={{ bottom: `${((norm * 60_000) / top) * 100}%` }}
        />
        {bars.map((bar) => (
          <span
            key={bar.number}
            title={
              bar.meanMs === null
                ? undefined
                : t("minutes", { minutes: Math.round(bar.meanMs / 60_000) })
            }
            className={cn(
              "rounded-t-[4px] rounded-b-[2px]",
              bar.meanMs === null
                ? "bg-untouched"
                : bar.meanMs > bar.normMs
                  ? "bg-overtime"
                  : "bg-data",
            )}
            style={{
              height: `${Math.max(((bar.meanMs ?? 0) / top) * 100, 2)}%`,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-10 gap-1.5 text-center text-subtle text-xs">
        {bars.map((bar) => (
          <span
            key={bar.number}
            className={cn(
              (bar.meanMs ?? 0) > bar.normMs &&
                "font-semibold text-overtime-text",
            )}
          >
            {bar.number}
          </span>
        ))}
      </div>
      <p className="text-[13px] text-subtle">
        {over.length > 0
          ? t("overNorm", { numbers: over.map((b) => b.number).join(", ") })
          : t("inNorm")}
      </p>
    </Card>
  );
}
