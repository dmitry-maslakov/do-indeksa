import type { Candidate } from "@/features/progress/learning/planner/contracts";
import { plan } from "@/features/progress/learning/planner/plan";
import { rules } from "@/features/progress/learning/planner/rules/rules";
import { signals } from "@/features/progress/learning/planner/signals/signals";
import { isDue, isRepeat } from "@/features/progress/learning/repeats/history";
import type { Learning } from "@/features/progress/learning/state";
import {
  isAnswered,
  type Touch,
  type TouchStatuses,
} from "@/features/progress/status";
import type { PickReason } from "./recommendation";
import { visitOf } from "./visit";

export const upcomingSize = 6;

export interface Pick {
  id: string;
  repeat: boolean;
  reason: PickReason;
}

interface Moment {
  pool: Candidate[];
  learning: Learning;
  seen: Map<string, number>;
  statuses: TouchStatuses;
  now: number;
}

interface QueueInput {
  pool: Candidate[];
  learningAt: (moment: number) => Learning;
  touches: Touch[];
  statuses: TouchStatuses;
  now: number;
  current?: string;
  size?: number;
}

function pickNext(
  { pool, learning, seen, statuses, now }: Moment,
  taken: Set<string>,
  picked: Candidate[],
): Pick | null {
  const open = pool.filter((t) => !taken.has(t.taskId));
  const due = (t: Candidate) => isDue(learning.tasks.get(t.taskId), now);
  const candidates = open.filter((t) => !seen.has(t.taskId) || due(t));
  const [planned] = plan(candidates, learning, signals, 1, {
    now,
    picked,
    rules,
  });
  if (planned) {
    const id = planned.candidate.taskId;
    const repeat = isRepeat(id, learning, now);
    return { id, repeat, reason: repeat ? "repeatDue" : planned.reason };
  }
  const [oldest] = open
    .filter(
      (t) =>
        seen.has(t.taskId) &&
        !isAnswered(statuses.get(t.taskId)) &&
        !learning.tasks.has(t.taskId),
    )
    .sort((a, b) => (seen.get(a.taskId) ?? 0) - (seen.get(b.taskId) ?? 0));
  return oldest ? { id: oldest.taskId, repeat: false, reason: "seen" } : null;
}

const seenBefore = (touches: Touch[], moment: number) =>
  new Map(
    touches.filter((t) => t.from < moment).map((t) => [t.taskId, t.from]),
  );

export function planQueue({
  pool,
  learningAt,
  touches,
  statuses,
  now,
  current,
  size = upcomingSize,
}: QueueInput) {
  const run = visitOf(touches, now);
  const begun = run[0]?.from ?? now;
  const steps = touches.filter((t) => t.from >= begun);
  if (current && !run.some((t) => t.taskId === current))
    steps.push({ taskId: current, kind: "first", from: now, to: now });
  const opened: string[] = [];
  let upcoming: Pick[] = [];

  const topUp = (moment: number) => {
    if (upcoming.length >= size) return;
    const context = {
      pool,
      statuses,
      learning: learningAt(moment),
      seen: seenBefore(touches, moment),
      now: Math.min(moment, now),
    };
    const taken = new Set([...opened, ...upcoming.map((p) => p.id)]);
    const picked = [...taken].flatMap((id) =>
      pool.filter((t) => t.taskId === id),
    );
    while (upcoming.length < size) {
      const next = pickNext(context, taken, picked);
      if (!next) break;
      taken.add(next.id);
      upcoming.push(next);
      picked.push(...pool.filter((t) => t.taskId === next.id));
    }
  };

  topUp(begun);
  for (const { taskId, from } of steps) {
    if (!opened.includes(taskId)) opened.push(taskId);
    upcoming = upcoming.filter((p) => p.id !== taskId);
    topUp(from);
  }
  const members = new Set(
    steps.filter((t) => t.kind !== "mock").map((t) => t.taskId),
  );
  return { visit: opened.filter((id) => members.has(id)), upcoming };
}
