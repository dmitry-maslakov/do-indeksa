import type { SuggestionReason } from "@/db/columns";
import type { TopicCandidate } from "./learning/planner/contracts";
import { plan, scoring } from "./learning/planner/plan";
import { lastPracticed } from "./learning/planner/topic-signals/last-practiced";
import { topicSignals } from "./learning/planner/topic-signals/topic-signals";
import {
  defaultPolicy,
  type LearningPolicy,
  type TopicSignalName,
} from "./learning/policy";
import type { Learning } from "./learning/state";
import { isMastered, type TopicStatus } from "./learning/status/topic-status";

export interface TopicProgress extends TopicStatus {
  topic: string;
}

export interface Suggestion {
  topic: string;
  reason: SuggestionReason;
}

const reasons: Record<TopicSignalName, SuggestionReason> = {
  stuck: "stuck",
  review: "review",
  finishTopic: "almost",
  keepGoing: "started",
  switchTopic: "started",
  startNext: "next",
  keepInShape: "review",
};

const isFresh = (learning: Learning) => lastPracticed(learning) === undefined;

function ownReason(topic: string, learning: Learning): SuggestionReason {
  const status = learning.get(topic)?.status;
  if (status?.state === "notStarted") return "next";
  return status?.almost ? "almost" : "started";
}

export function reasonOf(
  signal: TopicSignalName,
  topic: string,
  learning: Learning,
): SuggestionReason {
  if (signal === "startNext" && isFresh(learning)) return "first";
  if (signal === "switchTopic") return ownReason(topic, learning);
  return reasons[signal];
}

function fallback(learning: Learning): Suggestion | undefined {
  const topics = [...learning];
  const open = topics.find(
    ([, t]) => t.status.state !== "notStarted" && !isMastered(t.status.state),
  );
  const [first] = topics;
  if (isFresh(learning)) return first && { topic: first[0], reason: "first" };
  if (open) return { topic: open[0], reason: "started" };
  return first && { topic: first[0], reason: "done" };
}

export function suggest(
  learning: Learning,
  policy: LearningPolicy = defaultPolicy,
): Suggestion | undefined {
  const candidates: TopicCandidate[] = [...learning.keys()].map((topic) => ({
    topic,
  }));
  const scored = scoring(candidates, learning, topicSignals, policy);
  const [decision] = plan(scored, learning, topicSignals, 1, [], policy);
  return decision
    ? {
        topic: decision.candidate.topic,
        reason: reasonOf(decision.reason, decision.candidate.topic, learning),
      }
    : fallback(learning);
}
