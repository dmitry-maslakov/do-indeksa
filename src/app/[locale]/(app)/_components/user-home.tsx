import { useLocale } from "next-intl";
import type { CurrentRun } from "@/features/exam/current-run";
import { weeklyVariant } from "@/features/exam/weekly";
import type { getTopicPlan } from "@/features/progress/progress";
import { topicLook, topicName } from "@/features/tasks/topics";
import { ExamYears } from "./exam-years";
import { ResumeRun } from "./resume-run";
import { TodayHero } from "./today-hero";
import { TopicMap } from "./topic-map";
import { WeeklyCard } from "./weekly-card";

type UserHomeProps = Awaited<ReturnType<typeof getTopicPlan>> & {
  current?: CurrentRun;
};

export function UserHome({ topics, suggestion, current }: UserHomeProps) {
  const locale = useLocale();
  const weekly = weeklyVariant();

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6 md:gap-5 md:px-10 md:pt-6 md:pb-8">
      {suggestion && <TodayHero {...suggestion} />}
      <ResumeRun account={current} />
      {weekly && <WeeklyCard {...weekly} />}
      <TopicMap
        rows={topics.map((t) => ({
          topic: t.topic,
          name: topicName(t.topic, locale),
          look: topicLook(t.topic),
          pct: t.pct,
          state: t.state,
        }))}
      />
      <ExamYears />
    </main>
  );
}
