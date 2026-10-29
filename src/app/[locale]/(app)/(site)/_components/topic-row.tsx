import { cn } from "cn";
import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/progress-bar";
import { TopicIcon } from "@/features/catalog/topic-icon";
import type { TopicLook } from "@/features/catalog/topic-look";
import type { TopicProgress } from "@/features/progress/topic-progress";
import type { TopicState } from "@/features/progress/topic-status";
import { Link } from "@/i18n/navigation";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";

export interface TopicRowProps extends Pick<TopicProgress, "topic" | "state"> {
  fill: number;
  name: string;
  look: TopicLook;
  href: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

const bar: Record<TopicState, string> = {
  mastered: "bg-success",
  warming: "bg-progress",
  inProgress: "bg-progress",
  review: "bg-overtime",
  notStarted: "bg-transparent",
};

const pill: Record<TopicState, string> = {
  mastered: "bg-success-tint text-success-text",
  warming: "bg-progress-tint text-progress-text",
  inProgress: "bg-progress-tint text-progress-text",
  review: "bg-overtime-tint text-overtime-text",
  notStarted: "bg-muted text-subtle",
};

export function TopicRow({
  name,
  look,
  fill,
  state,
  href,
  recommendation,
}: TopicRowProps) {
  const t = useTranslations("Home");
  const seen = useExposure("recommendation_made", recommendation);

  return (
    <li>
      <Link
        ref={seen}
        href={href}
        prefetch={false}
        data-intent={intentOf({ via: "picker", placement: "topic_row" })}
        className="flex items-center gap-3 border-b py-3 text-sm md:gap-4 md:text-base"
      >
        <TopicIcon {...look} size="md" />
        <span className="min-w-0 flex-1">{name}</span>
        <ProgressBar
          value={fill}
          tone={bar[state]}
          className="h-2 w-12 shrink-0 md:w-20"
        />
        <span className="flex w-24 shrink-0 justify-end">
          <span
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 font-semibold text-xs",
              pill[state],
            )}
          >
            {t(`state.${state}`)}
          </span>
        </span>
      </Link>
    </li>
  );
}
