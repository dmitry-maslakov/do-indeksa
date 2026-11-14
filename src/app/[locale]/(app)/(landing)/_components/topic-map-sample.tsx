import { cn } from "cn";
import { useLocale, useTranslations } from "next-intl";
import { ProgressBar } from "@/components/progress-bar";
import { examOf } from "@/features/catalog/exams";
import { TopicIcon } from "@/features/catalog/topic-icon";
import { topicLook, topicName } from "@/features/catalog/topics";
import type { TopicState } from "@/features/progress/learning/status/topic-status";
import { stateBar, statePill } from "@/features/progress/state-look";

const demo: { state: TopicState; fill: number }[] = [
  { state: "mastered", fill: 1 },
  { state: "mastered", fill: 1 },
  { state: "review", fill: 1 },
  { state: "inProgress", fill: 0.7 },
  { state: "warming", fill: 0.25 },
  { state: "notStarted", fill: 0 },
  { state: "inProgress", fill: 0.45 },
];

const stateAt = (i: number) =>
  demo[i] ?? { state: "notStarted" as const, fill: 0 };

export const stuckTopic = (sample: string) =>
  examOf(sample).positions[demo.findIndex((d) => d.state === "warming")]?.topic;

export function TopicMapSample({ sample }: { sample: string }) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 h-105 w-full overflow-hidden rounded-3xl bg-muted px-4 pt-4 mask-b-from-64% lg:h-125 lg:w-110 lg:px-6 lg:pt-5"
    >
      <span className="mb-1 block font-semibold text-base leading-6.5 lg:text-lg">
        {t("topicMap")}
      </span>
      {examOf(sample).positions.map(({ number, topic }, i) => {
        const { state, fill } = stateAt(i);
        return (
          <span
            key={number}
            className="flex items-center gap-3 border-b py-2.5 text-sm lg:gap-3.5 lg:py-3 lg:text-[15px] lg:leading-5"
          >
            <TopicIcon {...topicLook(topic)} size="md" />
            <span className="min-w-0 flex-1 truncate">
              {topicName(topic, locale)}
            </span>
            <ProgressBar
              value={fill}
              tone={stateBar[state]}
              className="h-2 w-11 shrink-0 lg:w-16"
            />
            <span className="flex w-22 shrink-0 justify-end lg:w-24">
              <span
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1 font-semibold text-xs lg:px-3",
                  statePill[state],
                  state === "notStarted" && "bg-card",
                )}
              >
                {t(`state.${state}`)}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
