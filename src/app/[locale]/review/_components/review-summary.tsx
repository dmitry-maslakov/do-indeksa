import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import type { Review } from "@/lib/review";

interface ReviewSummaryProps {
  review: Review;
  variantId: string;
  title: string;
  finishedAt: Date;
}

export function ReviewSummary({
  review,
  variantId,
  title,
  finishedAt,
}: ReviewSummaryProps) {
  const t = useTranslations("Review");
  const format = useFormatter();
  const minutes = Math.round(review.spentMs / 60_000);
  const missed = [
    ...new Set(
      review.rows.filter((r) => r.earned < r.points).map((r) => r.topic),
    ),
  ];

  return (
    <Card className="gap-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/variants"
            className="text-[13px] text-subtle hover:text-foreground"
          >
            {t("crumb", {
              title,
              date: format.dateTime(finishedAt, {
                day: "numeric",
                month: "long",
              }),
            })}
          </Link>
          <p className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-bold text-5xl leading-none tracking-tighter">
              {review.score}
            </span>
            <span className="text-subtle">
              {t("score", {
                max: review.max,
                correct: review.correct,
                total: review.rows.length,
              })}{" "}
              ·{" "}
              {t("duration", {
                hours: Math.floor(minutes / 60),
                minutes: minutes % 60,
              })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="ghost"
            render={<Link href={`/variants/${variantId}`} />}
            nativeButton={false}
          >
            {t("retry")}
          </Button>
          {missed.length > 0 && (
            <Button
              render={
                <Link
                  href={`/variants/compose?mode=topics&${missed.map((topic) => `topic=${topic}`).join("&")}`}
                />
              }
              nativeButton={false}
            >
              {t("similar", { count: review.rows.length - review.correct })}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <VariantStrip
          size="lg"
          segments={review.rows.map((r) => r.segment)}
          label={t("strip", { score: review.score, max: review.max })}
        />
        <div className="flex gap-1 text-center text-subtle text-xs">
          {review.rows.map((r) => (
            <span key={r.taskId} className="flex-1">
              {r.number}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
