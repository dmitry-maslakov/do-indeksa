import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { Review } from "@/features/tests/review";

export function TimeSpent({ review }: { review: Review }) {
  const t = useTranslations("Review");
  const spent = Math.round(review.spentMs / 60_000);
  const norm = Math.round(review.normMs / 60_000);
  const over = review.rows.filter((r) => r.over);
  const minutes = review.rows[0]?.minutes ?? 0;
  const line = minutes * 60_000;
  const scale = Math.max(
    line * 1.25,
    ...review.rows.map((r) => r.attempt?.durationMs ?? 0),
  );
  const height = (ms: number) => `${(ms / scale) * 100}%`;

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-lg">{t("timeTitle")}</h2>
        <span className="text-muted-foreground text-sm tabular-nums">
          {t("timeOf", { spent, norm })}
        </span>
      </div>
      <div
        role="img"
        aria-label={t("timeOf", { spent, norm })}
        className="flex flex-col gap-1.5"
      >
        <div className="relative flex h-32 items-end gap-1.5">
          <span
            className="absolute inset-x-0 border-subtle/50 border-t-[1.5px] border-dashed"
            style={{ bottom: height(line) }}
          />
          <span
            className="absolute right-0 mb-1 text-[11px] text-subtle"
            style={{ bottom: height(line) }}
          >
            {t("minutes", { minutes })}
          </span>
          {review.rows.map((r) => (
            <span
              key={r.taskId}
              className={cn(
                "flex-1 rounded-t-sm rounded-b-[2px]",
                r.over ? "bg-muted-foreground" : "bg-input",
              )}
              style={{ height: height(r.attempt?.durationMs ?? 0) }}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          {review.rows.map((r) => (
            <span
              key={r.taskId}
              className="flex-1 text-center text-subtle text-xs tabular-nums"
            >
              {r.number}
            </span>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        {over.length > 0
          ? t("overNorm", {
              count: over.length,
              minutes,
              numbers: over.map((r) => r.number).join(", "),
            })
          : t("inNorm", { minutes })}
      </p>
    </section>
  );
}
