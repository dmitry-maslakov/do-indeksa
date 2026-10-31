import type { TopicSignal } from "../contracts";

export const keepInShape: TopicSignal = {
  name: "keepInShape",
  score: ({ topic }, { learning, policy }) => {
    const state = learning.get(topic);
    return state?.status.state === "mastered" &&
      (state.idleMs ?? 0) >= policy.keepInShapeAfterMs
      ? 1
      : 0;
  },
};
