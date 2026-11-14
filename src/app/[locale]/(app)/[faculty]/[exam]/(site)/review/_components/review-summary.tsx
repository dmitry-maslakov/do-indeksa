import { ArrowUpRightIcon, InfoIcon, RotateCcwIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Review } from "@/features/tests/review";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { useDuration } from "@/lib/use-duration";
import { ShareButton } from "./share-button";

interface ReviewSummaryProps {
  review: Review;
  variantId: string;
  href: string;
  title: string;
  original?: string;
  finishedAt: Date;
  children?: ReactNode;
}

const action = "h-10 rounded-full px-4 text-sm max-md:flex-1";

export function ReviewSummary({
  review,
  variantId,
  href,
  title,
  original,
  finishedAt,
  children,
}: ReviewSummaryProps) {
  const t = useTranslations("Review");
  const variants = useTranslations("Variants");
  const format = useFormatter();
  const duration = useDuration();

  return (
    <section className="flex flex-col gap-4 md:gap-5">
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
              className="inline-flex items-center gap-0.5 underline underline-offset-3 hover:text-foreground"
            >
              {variants("original")}
              <ArrowUpRightIcon aria-hidden className="size-3" />
            </a>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
        <p className="flex items-baseline gap-2">
          <span className="font-bold text-4xl leading-none tracking-tight tabular-nums">
            {format.number(review.score)}
          </span>
          <span className="text-lg text-muted-foreground">
            {t("outOf", { max: review.max })}
          </span>
        </p>
        {review.timed && (
          <p className="flex items-baseline gap-4 text-lg text-muted-foreground tabular-nums">
            <span
              aria-hidden
              className="size-1 self-center rounded-full bg-input"
            />
            {duration(review.spentMs)}
          </p>
        )}
        <div className="flex gap-2 self-center max-md:w-full md:ml-auto">
          <Button
            variant="ghost"
            className={action}
            render={
              <Link
                href={href}
                data-intent={intentOf({ via: "review", placement: "retry" })}
              />
            }
            nativeButton={false}
          >
            <RotateCcwIcon />
            {t("retry")}
          </Button>
          <ShareButton
            title={title}
            variantId={variantId}
            href={href}
            className={action}
          />
        </div>
      </div>
      <details className="group/estimate -mt-1 md:-mt-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm text-[13px] text-subtle outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <InfoIcon aria-hidden className="size-3.5" />
          {t("estimateLink")}
        </summary>
        <p className="mt-2 max-w-xl text-[13px] text-muted-foreground leading-normal">
          {t("estimate")}
        </p>
      </details>
      {children}
    </section>
  );
}
