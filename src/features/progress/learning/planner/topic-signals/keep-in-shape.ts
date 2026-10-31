import type { TopicSignal } from "../contracts";

export const keepInShape: TopicSignal = {
  name: "keepInShape",
  score: ({ topic }, { learning, policy, now }) => {
    const state = learning.topics.get(topic);
    return state?.status.state === "mastered" &&
      now - (state.status.lastAt ?? now) >= policy.keepInShapeAfterMs
      ? 1
      : 0;
  },
};
