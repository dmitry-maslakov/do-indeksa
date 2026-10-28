import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { segmentTone } from "@/components/segment-tone";
import { TopicGlyph, TopicIcon } from "@/features/catalog/topic-icon";
import { topicLook } from "@/features/catalog/topics";
import type { WeeklyVariant } from "@/features/variants/weekly";
import { Link } from "@/i18n/navigation";
import type { Segment } from "@/lib/strip";
import { reviewHref } from "../review";
import type { TestSummary } from "../summaries";
import { WeeklyWave } from "./weekly-wave";

const chipTone = (segment: Segment) =>
  segment === "done" ? "bg-card text-success-text" : segmentTone[segment].chip;

function ResultChips({ test }: { test: TestSummary }) {
  return test.looks
    .map((look, i) => ({ look, position: i + 1 }))
    .map(({ look, position }) => (
      <span
        key={position}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg font-bold [&_svg]:size-3",
          chipTone(test.segments[position - 1] ?? "none"),
        )}
      >
        <TopicGlyph icon={look.icon} size="sm" />
      </span>
    ));
}

interface WeeklyCardProps extends WeeklyVariant {
  test?: TestSummary;
}

export function WeeklyCard({
  id,
  tasks,
  topics,
  hours,
  points,
  daysLeft,
  test,
}: WeeklyCardProps) {
  const home = useTranslations("Home");
  const t = useTranslations("Variants");
  const format = useFormatter();

  return (
    <div className="@container">
      <section className="relative flex flex-col items-start overflow-hidden rounded-xl bg-lime px-5 py-6 @4xl:grid @4xl:grid-cols-[auto_1fr_auto] @4xl:items-center @4xl:gap-x-8 @4xl:gap-y-2 @4xl:px-8">
        <WeeklyWave className="@4xl:w-1/3" />
        <h2 className="relative font-semibold text-xl tracking-tight @4xl:col-start-1 @4xl:row-start-1">
          {home("weekly")}
        </h2>
        <div className="relative mt-1 @4xl:col-start-1 @4xl:row-start-2 @4xl:mt-0">
          {test ? (
            <>
              <p className="tabular-nums">
                <b className="font-bold text-4xl tracking-tight">
                  {format.number(test.score)}
                </b>
                <span className="font-semibold text-lime-text">
                  {" "}
                  / {test.max}
                </span>
              </p>
              <p className="text-lime-text text-xs">
                {t("weeklyNext", { days: daysLeft })}
              </p>
            </>
          ) : (
            <p className="text-xs">
              {home("weeklyMeta", {
                tasks,
                hours,
                points,
                days: daysLeft,
              })}
            </p>
          )}
        </div>
        <div
          className={cn(
            "relative my-4 flex max-w-50 flex-wrap @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1 @4xl:my-0 @4xl:max-w-none @4xl:flex-nowrap @4xl:justify-self-center",
            test ? "gap-1" : "gap-2",
          )}
        >
          {test ? (
            <ResultChips test={test} />
          ) : (
            topics.map(({ id, topic }) => (
              <TopicIcon key={id} {...topicLook(topic)} size="md" />
            ))
          )}
        </div>
        <Link
          href={test ? reviewHref(test.id) : `/variants/${id}`}
          className="relative mt-1 inline-flex h-13 w-full items-center justify-center rounded-lg bg-card px-4 font-semibold text-sm focus-visible:outline-2 focus-visible:outline-ring @4xl:col-start-3 @4xl:row-span-2 @4xl:row-start-1 @4xl:mt-0 @4xl:h-9 @4xl:w-auto"
        >
          {test ? t("weeklyReview") : home("startWeekly")}
        </Link>
      </section>
    </div>
  );
}
