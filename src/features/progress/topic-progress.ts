import type { SuggestionReason } from "@/db/columns";
import type { TopicCandidate } from "./learning/planner/contracts";
import { plan, signalled } from "./learning/planner/plan";
import {
  lastPracticed,
  restingToday,
} from "./learning/planner/topic-signals/last-practiced";
import { topicSignals } from "./learning/planner/topic-signals/topic-signals";
import {
  defaultPolicy,
  type LearningPolicy,
  type TopicSignalName,
} from "./learning/policy";
import type { Learning } from "./learning/state";
import { isOpen } from "./learning/status/topic-status";

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
  const status = learning.topics.get(topic)?.status;
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

function fallback(
  topics: string[],
  learning: Learning,
): Suggestion | undefined {
  const open = topics.find((topic) => {
    const state = learning.topics.get(topic)?.status.state;
    return state !== undefined && isOpen(state);
  });
  const [first] = topics;
  if (first === undefined) return;
  if (isFresh(learning)) return { topic: first, reason: "first" };
  if (open) return { topic: open, reason: "started" };
  return { topic: first, reason: "done" };
}

export function suggest(
  learning: Learning,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): Suggestion | undefined {
  const resting = restingToday(learning, policy);
  const topics = [...learning.topics.keys()].filter(
    (topic) => topic !== resting,
  );
  const candidates: TopicCandidate[] = topics.map((topic) => ({ topic }));
  const scored = signalled(candidates, learning, topicSignals, {
    now,
    policy,
  });
  const [decision] = plan(scored, learning, topicSignals, 1, { now, policy });
  return decision
    ? {
        topic: decision.candidate.topic,
        reason: reasonOf(decision.reason, decision.candidate.topic, learning),
      }
    : fallback(topics, learning);
}
