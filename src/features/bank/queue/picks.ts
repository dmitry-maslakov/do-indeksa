import type { Candidate } from "@/features/progress/learning/planner/contracts";
import { plan } from "@/features/progress/learning/planner/plan";
import { rules } from "@/features/progress/learning/planner/rules/rules";
import { signals } from "@/features/progress/learning/planner/signals/signals";
import { isDue, isRepeat } from "@/features/progress/learning/repeats/history";
import type { Learning } from "@/features/progress/learning/state";
import type { Touched } from "@/features/progress/status";
import type { PickReason } from "./recommendation";

export interface Pick {
  id: string;
  repeat: boolean;
  reason: PickReason;
}

interface QueueInput {
  pool: Candidate[];
  learning: Learning;
  touched: Map<string, Touched>;
  now: number;
  current?: string;
  size?: number;
}

const byTime = (touched: Map<string, Touched>, today: boolean) =>
  [...touched]
    .filter(([, t]) => t.today === today)
    .sort(([, a], [, b]) => a.at.getTime() - b.at.getTime())
    .map(([id]) => id);

function pickNext(
  { pool, learning, touched, now }: QueueInput,
  taken: Set<string>,
  picked: Candidate[],
): Pick | null {
  const open = pool.filter((t) => !taken.has(t.taskId));
  const due = (t: Candidate) => isDue(learning.tasks.get(t.taskId), now);
  const candidates = open.filter((t) => !touched.has(t.taskId) || due(t));
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
  const seen = open
    .filter(
      (t) =>
        touched.has(t.taskId) &&
        !touched.get(t.taskId)?.status &&
        !learning.tasks.has(t.taskId),
    )
    .sort(
      (a, b) =>
        (touched.get(a.taskId)?.at.getTime() ?? 0) -
        (touched.get(b.taskId)?.at.getTime() ?? 0),
    );
  return seen[0] ? { id: seen[0].taskId, repeat: false, reason: "seen" } : null;
}

export function planQueue(input: QueueInput) {
  const { pool, touched, current, size = 6 } = input;
  const today = byTime(touched, true);
  if (current && !today.includes(current)) today.push(current);
  const earlier = byTime(touched, false)
    .filter((id) => id !== current)
    .slice(-4);
  const taken = new Set(today);
  const upcoming: Pick[] = [];
  const picked = today.flatMap((id) => pool.filter((t) => t.taskId === id));
  while (upcoming.length < size) {
    const next = pickNext(input, taken, picked);
    if (!next) break;
    taken.add(next.id);
    upcoming.push(next);
    const task = pool.find((t) => t.taskId === next.id);
    if (task) picked.push(task);
  }
  return { earlier, today, upcoming };
}
