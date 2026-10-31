import type { TopicSignal } from "../contracts";

export const finishTopic: TopicSignal = {
  name: "finishTopic",
  score: ({ topic }, { learning }) =>
    learning.topics.get(topic)?.status.almost ? 1 : 0,
};
