import type { TopicSignal } from "../contracts";

export const stuck: TopicSignal = {
  name: "stuck",
  score: ({ topic }, { learning, policy }) =>
    (learning.topics.get(topic)?.failStreak ?? 0) >= policy.stuckAfter ? 1 : 0,
};
