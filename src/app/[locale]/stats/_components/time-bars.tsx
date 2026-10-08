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

interface Bar {
  number: number;
  meanMs: number | null;
  normMs: number;
}

const columns = "grid grid-cols-10 gap-1.5";

const ghost = (
  <div className={cn(columns, "h-28 items-end")}>
    {[45, 70, 35, 85, 55, 40, 65, 30, 75, 50].map((height) => (
      <Skeleton
        key={height}
        className="rounded-t-[4px] rounded-b-[2px]"
        style={{ height: `${height}%` }}
      />
    ))}
  </div>
);

export function TimeBars({
  bars,
  pending,
}: {
  bars: Bar[];
  pending?: boolean;
}) {
  const t = useTranslations("Stats");
  const home = useTranslations("Home");
  const norm = Math.round((bars[0]?.normMs ?? 0) / 60_000);

  return (
    <Card size="lg" className="gap-4">
      <CardHeader>
        <CardTitle>{t("time")}</CardTitle>
        <CardDescription>{t("timeNote", { norm })}</CardDescription>
      </CardHeader>
      {!pending && bars.every((b) => b.meanMs === null) ? (
        <EmptyNote
          ghost={ghost}
          text={home("timeEmpty")}
          signedIn
          href="/variants"
          action={home("startTest")}
        />
      ) : (
        <TimeColumns bars={bars} norm={norm} pending={pending} />
      )}
    </Card>
  );
}

interface TimeColumnsProps {
  bars: Bar[];
  norm: number;
  pending?: boolean;
}

function TimeColumns({ bars, norm, pending }: TimeColumnsProps) {
  const t = useTranslations("Stats");
  const top =
    Math.max(...bars.map((b) => Math.max(b.meanMs ?? 0, b.normMs))) * 1.15 || 1;
  const over = bars.filter((b) => (b.meanMs ?? 0) > b.normMs);

  return (
    <>
      {pending ? (
        ghost
      ) : (
        <div className={cn(columns, "relative h-28 items-end")}>
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
      )}
      <div className={cn(columns, "text-center text-subtle text-xs")}>
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
      {pending ? (
        <Skeleton className="my-1 h-3 w-56" />
      ) : (
        <p className="text-[13px] text-subtle">
          {over.length > 0
            ? t("overNorm", { numbers: over.map((b) => b.number).join(", ") })
            : t("inNorm")}
        </p>
      )}
    </>
  );
}
