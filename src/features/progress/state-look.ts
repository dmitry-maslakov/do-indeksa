import type { TopicState } from "./learning/status/topic-status";

export const stateBar: Record<TopicState, string> = {
  mastered: "bg-success",
  warming: "bg-progress",
  inProgress: "bg-progress",
  review: "bg-overtime",
  notStarted: "bg-transparent",
};

export const statePill: Record<TopicState, string> = {
  mastered: "bg-success-tint text-success-text",
  warming: "bg-progress-tint text-progress-text",
  inProgress: "bg-progress-tint text-progress-text",
  review: "bg-overtime-tint text-overtime-text",
  notStarted: "bg-muted text-subtle",
};
