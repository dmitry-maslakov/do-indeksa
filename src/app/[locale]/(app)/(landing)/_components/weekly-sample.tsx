import { useTranslations } from "next-intl";
import { examOf, examRecord } from "@/features/catalog/exams";
import { TopicIcon } from "@/features/catalog/topic-icon";
import { topicLook } from "@/features/catalog/topics";
import { WeeklyWave } from "@/features/tests/weekly/weekly-wave";
import type { WeeklyVariant } from "@/features/variants/weekly";

interface WeeklySampleProps {
  sample: string;
  weekly?: WeeklyVariant;
}

export function WeeklySample({ sample, weekly }: WeeklySampleProps) {
  const t = useTranslations("Home");
  const landing = useTranslations("Landing");
  const { positions } = examOf(sample);
  const { points, minutes = 0 } = examRecord(sample);
  const format = { tasks: positions.length, hours: minutes / 60, points };

  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 w-75 overflow-hidden rounded-3xl bg-lime px-4.5 pt-5 pb-4.5 lg:w-105 lg:p-6 xl:-left-20"
    >
      <WeeklyWave />
      <span className="relative block font-semibold text-lg lg:text-xl">
        {t("weekly")}
      </span>
      <span className="relative mt-1 block text-xs">
        {weekly
          ? t("weeklyMeta", { ...format, days: weekly.daysLeft })
          : landing("format", format)}
      </span>
      <span className="relative my-4 flex max-w-53 flex-wrap gap-2 lg:max-w-55">
        {positions.map(({ number, topic }) => (
          <TopicIcon key={number} {...topicLook(topic)} size="md" />
        ))}
      </span>
      <span className="relative flex h-12 items-center justify-center rounded-xl bg-card font-semibold text-sm lg:h-13">
        {t("startWeekly")}
      </span>
    </div>
  );
}
