import { cn } from "cn";
import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/progress-bar";
import { TopicIcon } from "@/features/catalog/topic-icon";
import type { TopicLook } from "@/features/catalog/topic-look";
import type {
  TopicProgress,
  TopicState,
} from "@/features/progress/topic-progress";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

export interface TopicRowProps
  extends Pick<TopicProgress, "topic" | "pct" | "state"> {
  name: string;
  look: TopicLook;
  href: string;
}

const bar: Record<TopicState, string> = {
  mastered: "bg-success",
  inProgress: "bg-progress",
  review: "bg-overtime",
  notStarted: "bg-transparent",
};

const pill: Record<TopicState, string> = {
  mastered: "bg-success-tint text-success-text",
  inProgress: "bg-progress-tint text-progress-text",
  review: "bg-overtime-tint text-overtime-text",
  notStarted: "bg-muted text-subtle",
};

export function TopicRow({ name, look, pct, state, href }: TopicRowProps) {
  const t = useTranslations("Home");

  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        data-intent={intentOf({ via: "picker", placement: "topic_row" })}
        className="flex items-center gap-3 border-b py-3 text-sm md:gap-4 md:text-base"
      >
        <TopicIcon {...look} size="md" />
        <span className="min-w-0 flex-1">{name}</span>
        <ProgressBar
          value={pct / 100}
          tone={bar[state]}
          className="h-2 w-20 shrink-0 max-md:hidden"
        />
        <b className="w-10 shrink-0 text-right font-bold text-sm">{pct}%</b>
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
