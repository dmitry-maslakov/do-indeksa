import { useTranslations } from "next-intl";
import type { WeeklyVariant } from "@/features/exam/weekly";
import { WeeklyWave } from "@/features/exam/weekly-wave";
import { TopicIcon } from "@/features/tasks/topic-icon";
import { topicLook } from "@/features/tasks/topics";
import { Link } from "@/i18n/navigation";

export function WeeklyCard({
  id,
  tasks,
  topics,
  hours,
  points,
  daysLeft,
}: WeeklyVariant) {
  const t = useTranslations("Home");

  return (
    <section className="relative flex flex-col items-start overflow-hidden rounded-xl bg-lime px-5 py-6 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-x-8 lg:gap-y-2 lg:px-8">
      <WeeklyWave className="lg:w-1/3" />
      <h2 className="relative font-semibold text-xl tracking-tight lg:col-start-1 lg:row-start-1">
        {t("weekly")}
      </h2>
      <p className="relative mt-1 text-xs lg:col-start-1 lg:row-start-2 lg:mt-0">
        {t("weeklyMeta", {
          tasks,
          hours,
          points,
          days: daysLeft,
        })}
      </p>
      <div className="relative my-4 flex max-w-50 flex-wrap gap-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:my-0 lg:max-w-none lg:flex-nowrap lg:justify-self-center">
        {topics.map(({ id, topic }) => (
          <TopicIcon key={id} {...topicLook(topic)} size="md" />
        ))}
      </div>
      <Link
        href={`/variants/${id}`}
        className="relative mt-1 inline-flex h-13 w-full items-center justify-center rounded-lg bg-card px-4 font-semibold text-sm focus-visible:outline-2 focus-visible:outline-ring lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:h-9 lg:w-auto"
      >
        {t("startWeekly")}
      </Link>
    </section>
  );
}
