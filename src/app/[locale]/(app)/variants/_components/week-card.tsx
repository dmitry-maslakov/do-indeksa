import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { TopicGlyph } from "@/features/catalog/topic-icon";
import type { TopicLook } from "@/features/catalog/topic-look";
import { topicLook } from "@/features/catalog/topics";
import { reviewHref } from "@/features/tests/review";
import type { TestSummary } from "@/features/tests/summaries";
import type { WeeklyVariant } from "@/features/variants/weekly";
import { WeeklyWave } from "@/features/variants/weekly-wave";
import { Link } from "@/i18n/navigation";
import { type Result, resultOf, resultTone } from "./results";

const button =
  "relative inline-flex h-9 items-center rounded-lg bg-card px-4 font-semibold text-sm focus-visible:outline-2 focus-visible:outline-ring";

const chipTone: Record<Result, string> = {
  ...resultTone,
  ok: "bg-card text-success-text",
};

interface WeekCardProps extends WeeklyVariant {
  test?: TestSummary;
}

export function WeekCard({ id, topics, daysLeft, test }: WeekCardProps) {
  const home = useTranslations("Home");
  const t = useTranslations("Variants");
  const format = useFormatter();

  return (
    <section className="relative flex flex-col items-start overflow-hidden rounded-xl bg-lime px-5 py-6">
      <WeeklyWave />
      <h2 className="relative font-semibold text-xl tracking-tight">
        {home("weekly")}
      </h2>
      {test ? (
        <>
          <p className="relative mt-2 tabular-nums">
            <b className="font-bold text-4xl tracking-tight">
              {format.number(test.score)}
            </b>
            <span className="font-semibold text-lime-text"> / {test.max}</span>
          </p>
          <Chips
            chips={test.looks.map((look, i) => ({
              look,
              tone: chipTone[resultOf(test.segments[i] ?? "none")],
            }))}
          />
          <div className="relative flex flex-wrap items-center gap-3">
            <Link href={reviewHref(test.id)} className={button}>
              {t("weeklyReview")}
            </Link>
            <span className="text-lime-text text-xs">
              {t("weeklyNext", { days: daysLeft })}
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="relative mt-1 text-xs">
            {t("weeklyNext", { days: daysLeft })}
          </p>
          <Chips
            chips={topics.map(({ topic }) => ({
              look: topicLook(topic),
              tone: "bg-card",
            }))}
          />
          <Link href={`/variants/${id}`} className={button}>
            {home("startWeekly")}
          </Link>
        </>
      )}
    </section>
  );
}

function Chips({ chips }: { chips: { look: TopicLook; tone: string }[] }) {
  return (
    <div className="relative my-4 flex max-w-50 flex-wrap gap-1">
      {chips
        .map((chip, i) => ({ ...chip, position: i + 1 }))
        .map(({ look, tone, position }) => (
          <span
            key={position}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg font-bold [&_svg]:size-3",
              tone,
            )}
          >
            <TopicGlyph icon={look.icon} size="sm" />
          </span>
        ))}
    </div>
  );
}
