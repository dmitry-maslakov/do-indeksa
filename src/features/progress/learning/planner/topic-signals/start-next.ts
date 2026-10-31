import { isOpen } from "../../status/topic-status";
import type { TopicSignal } from "../contracts";

export const startNext: TopicSignal = {
  name: "startNext",
  score: ({ topic }, { learning, policy }) => {
    const topics = [...learning];
    const next = topics.find(([, t]) => t.status.state === "notStarted");
    const open = topics.filter(([, t]) => isOpen(t.status.state)).length;
    return topic === next?.[0] && open < policy.maxOpenTopics ? 1 : 0;
  },
};
