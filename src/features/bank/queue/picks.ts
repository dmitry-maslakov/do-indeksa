import type { Candidate } from "@/features/progress/learning/planner/contracts";
import { plan } from "@/features/progress/learning/planner/plan";
import { signals } from "@/features/progress/learning/planner/signals/signals";
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
  current?: string;
  size?: number;
}

const byTime = (touched: Map<string, Touched>, today: boolean) =>
  [...touched]
    .filter(([, t]) => t.today === today)
    .sort(([, a], [, b]) => a.at.getTime() - b.at.getTime())
    .map(([id]) => id);

const repeatOf = (task: Candidate): Pick => ({
  id: task.taskId,
  repeat: true,
  reason: "repeat",
});

function pickNext(
  { pool, learning, touched }: QueueInput,
  taken: Set<string>,
  recent: Set<string>,
  picked: Candidate[],
): Pick | null {
  const open = pool.filter((t) => !taken.has(t.taskId));
  const wrong = open.filter(
    (t) => touched.get(t.taskId)?.status === "wrong" && !recent.has(t.taskId),
  );
  if (taken.size % 4 === 3 && wrong[0]) return repeatOf(wrong[0]);
  const fresh = open.filter((t) => !touched.has(t.taskId));
  const [planned] = plan(fresh, learning, signals, 1, picked);
  if (planned)
    return {
      id: planned.candidate.taskId,
      repeat: false,
      reason: planned.reason,
    };
  const seen = open
    .filter((t) => touched.has(t.taskId) && !touched.get(t.taskId)?.status)
    .sort(
      (a, b) =>
        (touched.get(a.taskId)?.at.getTime() ?? 0) -
        (touched.get(b.taskId)?.at.getTime() ?? 0),
    );
  if (seen[0]) return { id: seen[0].taskId, repeat: false, reason: "seen" };
  return wrong[0] ? repeatOf(wrong[0]) : null;
}

export function planQueue(input: QueueInput) {
  const { pool, touched, current, size = 6 } = input;
  const today = byTime(touched, true);
  if (current && !today.includes(current)) today.push(current);
  const earlier = byTime(touched, false)
    .filter((id) => id !== current)
    .slice(-4);
  const taken = new Set(today);
  const recent = new Set(
    [...byTime(touched, false), ...byTime(touched, true)].slice(-3),
  );
  const upcoming: Pick[] = [];
  const picked: Candidate[] = [];
  while (upcoming.length < size) {
    const next = pickNext(input, taken, recent, picked);
    if (!next) break;
    taken.add(next.id);
    upcoming.push(next);
    const task = pool.find((t) => t.taskId === next.id);
    if (task) picked.push(task);
  }
  return { earlier, today, upcoming };
}
