import type { TopicSignal } from "../contracts";

export const review: TopicSignal = {
  name: "review",
  score: ({ topic }, { learning }) =>
    learning.topics.get(topic)?.status.state === "review" ? 1 : 0,
};
