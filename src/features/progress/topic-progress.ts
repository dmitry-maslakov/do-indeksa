import { maxBy } from "es-toolkit";
import { dayMs } from "@/lib/dates";
import type { TaskStat } from "./stats";

export const topicStates = [
  "mastered",
  "inProgress",
  "review",
  "notStarted",
] as const;

export type TopicState = (typeof topicStates)[number];

export interface TopicProgress {
  topic: string;
  pct: number;
  state: TopicState;
  lastAt: number | null;
}

type SuggestionReason = "first" | "stuck" | "next" | "almost" | "started";

export interface Suggestion {
  topic: string;
  reason: SuggestionReason;
}

const masteredPct = 70;
const almostPct = 55;
const reviewAfterMs = 7 * dayMs;

function stateOf(
  pct: number,
  mine: TaskStat[],
  lastAt: number | null,
  now: number,
): TopicState {
  if (lastAt === null) return "notStarted";
  if (now - lastAt > reviewAfterMs && mine.some((s) => !s.latestRight))
    return "review";
  return pct >= masteredPct ? "mastered" : "inProgress";
}

export function topicProgress(
  stats: TaskStat[],
  totals: { topic: string; total: number }[],
  now: number,
): TopicProgress[] {
  return totals.map(({ topic, total }) => {
    const mine = stats.filter((s) => s.topic === topic);
    const solved = mine.filter((s) => s.latestRight).length;
    const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
    const lastAt = maxBy(mine, (s) => s.lastAt)?.lastAt ?? null;
    return { topic, pct, lastAt, state: stateOf(pct, mine, lastAt, now) };
  });
}

export const lastPracticed = (topics: TopicProgress[]) =>
  maxBy(
    topics.filter((t) => t.lastAt !== null),
    (t) => t.lastAt ?? 0,
  );

export function suggest(
  topics: TopicProgress[],
  latest: boolean[],
): Suggestion | undefined {
  const last = lastPracticed(topics);
  if (!last) {
    const first = topics[0];
    return first && { topic: first.topic, reason: "first" };
  }
  if (latest.filter((right) => !right).length >= 2)
    return { topic: last.topic, reason: "stuck" };
  if (last.pct >= masteredPct) {
    const at = topics.indexOf(last);
    const next = [...topics.slice(at + 1), ...topics.slice(0, at)].find(
      (t) => t.pct < masteredPct,
    );
    if (next) return { topic: next.topic, reason: "next" };
  }
  return {
    topic: last.topic,
    reason: last.pct >= almostPct ? "almost" : "started",
  };
}
