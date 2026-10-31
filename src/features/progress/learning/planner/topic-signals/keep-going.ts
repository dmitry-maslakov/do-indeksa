import { isMastered } from "../../status/topic-status";
import type { TopicSignal } from "../contracts";
import { lastPracticed } from "./last-practiced";

export const keepGoing: TopicSignal = {
  name: "keepGoing",
  score: ({ topic }, { learning, policy }) => {
    const state = learning.topics.get(topic);
    return state &&
      topic === lastPracticed(learning) &&
      state.tasksToday < policy.tasksPerTopicPerDay &&
      !isMastered(state.status.state)
      ? 1
      : 0;
  },
};
