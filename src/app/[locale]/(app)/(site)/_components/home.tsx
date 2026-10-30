import { useLocale } from "next-intl";
import { type nextTasks, topicStart } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { topicLook, topicName } from "@/features/catalog/topics";
import type { getTopicPlan } from "@/features/progress/progress";
import { WeeklyCard } from "@/features/tests/weekly/weekly-card";
import { weeklyVariant } from "@/features/variants/weekly";
import { ExamYears } from "./exam-years";
import { TodayHero } from "./today-hero";
import { TopicMap } from "./topic-map";

type HomeProps = Awaited<ReturnType<typeof getTopicPlan>> & {
  starts: Awaited<ReturnType<typeof nextTasks>>;
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
          recommendation={recommendationOf(
            "home_hero",
            suggestion.topic,
            starts.get(suggestion.topic),
          )}
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
          recommendation: recommendationOf(
            "topic_row",
            t.topic,
            starts.get(t.topic),
          ),
        }))}
      />
      <ExamYears />
    </main>
  );
}
