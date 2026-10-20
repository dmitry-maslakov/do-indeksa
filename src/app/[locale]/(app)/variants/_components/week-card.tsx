import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { RunSummary } from "@/features/exam/run-summaries";
import type { WeeklyVariant } from "@/features/exam/weekly";
import { WeeklyWave } from "@/features/exam/weekly-wave";
import { reviewHref } from "@/features/review/review";
import { TopicGlyph } from "@/features/tasks/topic-icon";
import type { TopicLook } from "@/features/tasks/topic-look";
import { topicLook } from "@/features/tasks/topics";
import { Link } from "@/i18n/navigation";
import { type Result, resultOf, resultTone } from "./results";

const button =
  "relative inline-flex h-9 items-center rounded-lg bg-card px-4 font-semibold text-sm focus-visible:outline-2 focus-visible:outline-ring";

const chipTone: Record<Result, string> = {
  ...resultTone,
  ok: "bg-card text-success-text",
};

interface WeekCardProps extends WeeklyVariant {
  run?: RunSummary;
}

export function WeekCard({
  id,
  tasks,
  topics,
  hours,
  points,
  daysLeft,
  run,
}: WeekCardProps) {
  const home = useTranslations("Home");
  const t = useTranslations("Variants");

  return (
    <section className="relative flex flex-col items-start overflow-hidden rounded-xl bg-lime px-5 py-6">
      <WeeklyWave />
      <h2 className="relative font-semibold text-xl tracking-tight">
        {home("weekly")}
      </h2>
      {run ? (
        <>
          <p className="relative mt-2 tabular-nums">
            <b className="font-bold text-4xl tracking-tight">{run.score}</b>
            <span className="font-semibold text-lime-text"> / {run.max}</span>
          </p>
          <Chips
            chips={run.looks.map((look, i) => ({
              look,
              tone: chipTone[resultOf(run.segments[i] ?? "none")],
            }))}
          />
          <div className="relative flex flex-wrap items-center gap-3">
            <Link href={reviewHref(run.id)} className={button}>
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
            {home("weeklyMeta", { tasks, hours, points, days: daysLeft })}
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
