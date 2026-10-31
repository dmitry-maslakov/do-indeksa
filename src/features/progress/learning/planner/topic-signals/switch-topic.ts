import { isMastered } from "../../status/topic-status";
import type { TopicSignal } from "../contracts";
import { lastPracticed } from "./last-practiced";

export const switchTopic: TopicSignal = {
  name: "switchTopic",
  score: ({ topic }, { learning, policy }) => {
    const state = learning.get(topic);
    const last = lastPracticed(learning);
    return state &&
      last &&
      topic !== last &&
      (learning.get(last)?.tasksToday ?? 0) >= policy.tasksPerTopicPerDay &&
      !isMastered(state.status.state)
      ? 1
      : 0;
  },
};
