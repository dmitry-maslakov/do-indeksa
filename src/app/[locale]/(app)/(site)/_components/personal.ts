import "server-only";
import { nextTasks, topicStart } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { getTopicPlan } from "@/features/progress/progress";
import { getProfileId } from "@/server/profile";

export async function loadHome() {
  const profileId = await getProfileId();
  const [{ topics, suggestion }, starts] = await Promise.all([
    getTopicPlan(profileId),
    nextTasks(profileId),
  ]);
  return {
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
