import { useLocale } from "next-intl";
import { examTopics } from "@/features/catalog/exams";
import { topicLook, topicName } from "@/features/catalog/topics";
import { WeeklyCard } from "@/features/tests/weekly/weekly-card";
import type { WeeklyVariant } from "@/features/variants/weekly";
import { ExamYears } from "./exam-years";
import type { HomeData } from "./personal";
import { TodayHero } from "./today-hero";
import { TopicMap } from "./topic-map";

interface HomeProps {
  weekly?: WeeklyVariant;
  personal: Promise<HomeData>;
}

export function Home({ weekly, personal }: HomeProps) {
  const locale = useLocale();

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6 md:gap-5 md:px-10 md:pt-6 md:pb-8">
      <TodayHero suggestion={personal.then((p) => p.hero)} />
      {weekly && <WeeklyCard {...weekly} />}
      <TopicMap
        topics={examTopics.map((topic) => ({
          topic,
          name: topicName(topic, locale),
          look: topicLook(topic),
        }))}
        progress={personal.then((p) => p.rows)}
      />
      <ExamYears />
    </main>
  );
}
