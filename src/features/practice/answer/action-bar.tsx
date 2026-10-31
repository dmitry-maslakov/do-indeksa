import { cn } from "cn";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";

type Recommendation = BrowserEvents["recommendation_made"];

export interface NextTask {
  href?: string;
  recommendation?: Recommendation;
}

interface ActionBarProps {
  go: boolean;
  next?: Promise<NextTask>;
  fallback: string;
  onSkip: () => void;
  checked: boolean;
  disabled: boolean;
}

export const phoneBar =
  "fixed inset-x-0 bottom-[max(var(--keyboard-height,0px),calc(var(--nav-bottom)+env(safe-area-inset-bottom)))] z-30 flex gap-2 border-t bg-card p-3 md:contents";
const primary = cn(
  buttonVariants({ variant: "lime", size: "pill" }),
  "order-2 flex-1 md:order-1 md:flex-none",
);

function Skip({
  href,
  checked,
  recommendation,
  onClick,
}: {
  href?: string;
  checked: boolean;
  recommendation?: Recommendation;
  onClick: () => void;
}) {
  const t = useTranslations("Solve");
  const seen = useExposure(
    "recommendation_made",
    recommendation && { ...recommendation, surface: "skip" },
  );
  const look = cn(
    "order-1 px-4 md:order-2",
    !checked && "md:bg-transparent md:px-3",
  );
  const label = (
    <>
      {!checked && <ClockIcon className="md:hidden" />}
      <span>{t(checked ? "further" : "skip")}</span>
    </>
  );
  if (!href)
    return (
      <Button
        type="button"
        variant="ghost"
        size="pill"
        disabled
        className={look}
      >
        {label}
      </Button>
    );
  return (
    <Link
      ref={seen}
      href={href}
      onClick={onClick}
      data-intent={intentOf({ via: "picker", placement: "skip" })}
      className={cn(buttonVariants({ variant: "ghost", size: "pill" }), look)}
    >
      {label}
    </Link>
  );
}

export function ActionBar({
  go,
  next,
  fallback,
  onSkip,
  checked,
  disabled,
}: ActionBarProps) {
  const t = useTranslations("Solve");
  const step = next && use(next);
  const seen = useExposure("recommendation_made", step?.recommendation);
  return (
    <div className={phoneBar}>
      {go ? (
        <Link
          key={step?.href}
          ref={seen}
          href={step?.href ?? fallback}
          data-intent={intentOf({ via: "picker", placement: "next" })}
          className={primary}
        >
          <span className="md:hidden">{t("next")}</span>
          <span className="hidden md:inline">{t("nextTask")}</span>
          <ArrowRightIcon />
        </Link>
      ) : (
        <Button type="submit" disabled={disabled} className={primary}>
          {t("check")}
        </Button>
      )}
      {!go && (!step || step.href) && (
        <Skip
          key={step?.href}
          href={step?.href}
          checked={checked}
          recommendation={step?.recommendation}
          onClick={onSkip}
        />
      )}
    </div>
  );
}
