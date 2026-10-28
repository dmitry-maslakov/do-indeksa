import { cn } from "cn";
import { ArrowRightIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { segmentTone } from "@/components/segment-tone";
import { Button } from "@/components/ui/button";
import type { Review } from "@/features/tests/review";
import { Link } from "@/i18n/navigation";
import { toMinutes } from "@/lib/dates";
import { ShareButton } from "./share-button";

interface ReviewSummaryProps {
  review: Review;
  variantId: string;
  title: string;
  original?: string;
  finishedAt: Date;
  children?: ReactNode;
}

const action = "h-12 rounded-xl px-6 text-base max-md:w-full";

export function ReviewSummary({
  review,
  variantId,
  title,
  original,
  finishedAt,
  children,
}: ReviewSummaryProps) {
  const t = useTranslations("Review");
  const variants = useTranslations("Variants");
  const format = useFormatter();
  const minutes = toMinutes(review.spentMs);
  const missed = [
    ...new Set(
      review.rows.filter((r) => r.earned < r.points).map((r) => r.topic),
    ),
  ];

  return (
    <section className="flex flex-col gap-5.5 md:gap-7">
      <p className="flex flex-wrap gap-x-1.5 text-[13px] text-muted-foreground md:text-sm">
        <Link href="/variants" className="hover:text-foreground">
          {t("crumb", {
            title,
            date: format.dateTime(finishedAt, {
              day: "numeric",
              month: "long",
            }),
          })}
        </Link>
        {original && (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={original}
              target="_blank"
              rel="noopener"
              className="underline underline-offset-3 hover:text-foreground"
            >
              {variants("original")}
            </a>
          </>
        )}
      </p>
      <div className="grid gap-5.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
        <div className="flex flex-col gap-5.5 md:gap-6">
          <div className="flex flex-col gap-1.5">
            <p className="flex items-baseline gap-3">
              <span className="font-bold text-6xl leading-none tracking-tighter tabular-nums md:text-7xl">
                {format.number(review.score)}
              </span>
              <span className="text-muted-foreground text-xl">
                {t("outOf", { max: review.max })}
              </span>
            </p>
            <p className="text-muted-foreground tabular-nums">
              {t("correctOf", {
                correct: review.correct,
                total: review.rows.length,
              })}
              {" · "}
              {t("duration", {
                hours: Math.floor(minutes / 60),
                minutes: minutes % 60,
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-3">
            {missed.length > 0 && (
              <Button
                variant="lime"
                className={action}
                render={
                  <Link
                    href={`/variants/compose?mode=topics&${missed.map((topic) => `topic=${topic}`).join("&")}`}
                  />
                }
                nativeButton={false}
              >
                {t("similar", { count: review.rows.length - review.correct })}
                <ArrowRightIcon />
              </Button>
            )}
            <Button
              variant="ghost"
              className={action}
              render={<Link href={`/variants/${variantId}`} />}
              nativeButton={false}
            >
              {t("retry")}
            </Button>
            <ShareButton
              title={title}
              href={`/variants/${variantId}`}
              className={action}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <div
            role="img"
            aria-label={t("strip", { score: review.score, max: review.max })}
            className="flex gap-0.75 md:gap-1"
          >
            {review.rows.map((r) => (
              <span
                key={r.taskId}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "h-2.5 w-full rounded-full",
                    segmentTone[r.segment].bar,
                  )}
                />
                <span className="text-subtle text-xs tabular-nums">
                  {r.number}
                </span>
              </span>
            ))}
          </div>
          <p className="text-[13px] text-subtle leading-normal">
            {t("estimate")}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
