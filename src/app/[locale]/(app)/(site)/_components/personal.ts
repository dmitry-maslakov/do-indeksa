import "server-only";
import { getLocale } from "next-intl/server";
import { nextTasks, topicStart } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { getTopicPlan } from "@/features/progress/progress";
import { summarizeWeekly } from "@/features/tests/summaries";
import type { WeeklyVariant } from "@/features/variants/weekly";
import { getProfileId } from "@/server/profile";

export async function loadHome(examId: string, weekly?: WeeklyVariant) {
  const profileId = await getProfileId();
  const [{ topics, suggestion }, starts, weeklyTest] = await Promise.all([
    getTopicPlan(profileId, examId),
    nextTasks(profileId, examId),
    weekly && summarizeWeekly(profileId, examId, weekly, await getLocale()),
  ]);
  return {
    weeklyTest,
    hero: suggestion && {
      ...suggestion,
      href: topicStart(starts, suggestion.topic),
      recommendation: recommendationOf(
        "home_hero",
        suggestion.topic,
        starts.get(suggestion.topic),
      ),
    },
    rows: Object.fromEntries(
      topics.map(({ topic, fill, state }) => [
        topic,
        {
          fill,
          state,
          href: topicStart(starts, topic),
          recommendation: recommendationOf(
            "topic_row",
            topic,
            starts.get(topic),
          ),
        },
      ]),
    ),
  };
}

export type HomeData = Awaited<ReturnType<typeof loadHome>>;
