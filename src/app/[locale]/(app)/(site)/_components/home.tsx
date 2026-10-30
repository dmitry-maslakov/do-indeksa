import { useLocale } from "next-intl";
import { topicStart } from "@/features/bank/queue/queue";
import { topicLook, topicName } from "@/features/catalog/topics";
import type { getTopicPlan } from "@/features/progress/progress";
import { WeeklyCard } from "@/features/tests/weekly/weekly-card";
import { weeklyVariant } from "@/features/variants/weekly";
import { ExamYears } from "./exam-years";
import { TodayHero } from "./today-hero";
import { TopicMap } from "./topic-map";

type HomeProps = Awaited<ReturnType<typeof getTopicPlan>> & {
  starts: Map<string, string>;
};

export function Home({ topics, suggestion, starts }: HomeProps) {
  const locale = useLocale();
  const weekly = weeklyVariant();

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6 md:gap-5 md:px-10 md:pt-6 md:pb-8">
      {suggestion && (
        <TodayHero
          {...suggestion}
          href={topicStart(starts, suggestion.topic)}
        />
      )}
      {weekly && <WeeklyCard {...weekly} />}
      <TopicMap
        rows={topics.map((t) => ({
          topic: t.topic,
          name: topicName(t.topic, locale),
          look: topicLook(t.topic),
          pct: t.pct,
          state: t.state,
          href: topicStart(starts, t.topic),
        }))}
      />
      <ExamYears />
    </main>
  );
}
