import { isOpen } from "../../status/topic-status";
import type { TopicSignal } from "../contracts";
import { restingToday } from "./last-practiced";

export const switchTopic: TopicSignal = {
  name: "switchTopic",
  score: ({ topic }, { learning, policy }) => {
    const state = learning.get(topic)?.status.state;
    const resting = restingToday(learning, policy);
    return state !== undefined &&
      isOpen(state) &&
      resting !== undefined &&
      topic !== resting
      ? 1
      : 0;
  },
};
