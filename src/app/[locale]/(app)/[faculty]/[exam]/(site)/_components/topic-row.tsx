import { cn } from "cn";
import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicIcon } from "@/features/catalog/topic-icon";
import type { TopicLook } from "@/features/catalog/topic-look";
import { stateBar, statePill } from "@/features/progress/state-look";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";
import type { HomeData } from "./personal";

export interface TopicRowProps {
  topic: string;
  name: string;
  look: TopicLook;
  progress?: HomeData["rows"][string];
}

const row =
  "flex items-center gap-3 border-b py-3 text-sm md:gap-4 md:text-base";

export function TopicRow({ name, look, progress }: TopicRowProps) {
  const t = useTranslations("Home");
  const seen = useExposure("recommendation_made", progress?.recommendation);
  const label = (
    <>
      <TopicIcon {...look} size="md" />
      <span className="min-w-0 flex-1">{name}</span>
    </>
  );

  return (
    <li>
      {progress ? (
        <Link
          ref={seen}
          href={progress.href}
          data-intent={intentOf({ via: "picker", placement: "topic_row" })}
          className={row}
        >
          {label}
          <ProgressBar
            value={progress.fill}
            tone={stateBar[progress.state]}
            className="h-2 w-12 shrink-0 md:w-20"
          />
          <span className="flex w-24 shrink-0 justify-end">
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 font-semibold text-xs",
                statePill[progress.state],
              )}
            >
              {t(`state.${progress.state}`)}
            </span>
          </span>
        </Link>
      ) : (
        <div className={row}>
          {label}
          <ProgressBar value={0} className="h-2 w-12 shrink-0 md:w-20" />
          <span className="flex w-24 shrink-0 justify-end">
            <Skeleton className="h-6 w-20" />
          </span>
        </div>
      )}
    </li>
  );
}
