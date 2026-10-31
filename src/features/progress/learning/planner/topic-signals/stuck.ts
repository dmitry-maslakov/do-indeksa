import type { TopicSignal } from "../contracts";

export const stuck: TopicSignal = {
  name: "stuck",
  score: ({ topic }, { learning, policy }) =>
    (learning.get(topic)?.failStreak ?? 0) >= policy.stuckAfter ? 1 : 0,
};
