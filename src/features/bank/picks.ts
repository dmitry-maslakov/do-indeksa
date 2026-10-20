import type { Attempted } from "@/features/progress/status";

interface PoolTask {
  id: string;
  exam: boolean;
}

export interface Pick {
  id: string;
  repeat: boolean;
}

interface QueueInput {
  pool: PoolTask[];
  attempts: Map<string, Attempted>;
  seen: Map<string, Date>;
  current?: string;
  size?: number;
}

const byTime = (attempts: Map<string, Attempted>, today: boolean) =>
  [...attempts]
    .filter(([, a]) => a.today === today)
    .sort(([, a], [, b]) => a.at.getTime() - b.at.getTime())
    .map(([id]) => id);

function pickNext(
  pool: PoolTask[],
  attempts: Map<string, Attempted>,
  seen: Map<string, Date>,
  taken: Set<string>,
  recent: Set<string>,
): Pick | null {
  const open = pool.filter((t) => !taken.has(t.id));
  const wrong = open.filter(
    (t) => attempts.get(t.id)?.status === "wrong" && !recent.has(t.id),
  );
  if (taken.size % 4 === 3 && wrong[0])
    return { id: wrong[0].id, repeat: true };
  const untried = open.filter((t) => !attempts.has(t.id));
  const fresh = untried.filter((t) => !seen.has(t.id));
  const later = untried
    .filter((t) => seen.has(t.id))
    .sort(
      (a, b) =>
        (seen.get(a.id)?.getTime() ?? 0) - (seen.get(b.id)?.getTime() ?? 0),
    );
  const next = fresh.find((t) => t.exam) ?? fresh[0] ?? later[0];
  if (next) return { id: next.id, repeat: false };
  return wrong[0] ? { id: wrong[0].id, repeat: true } : null;
}

export function planQueue({
  pool,
  attempts,
  seen,
  current,
  size = 6,
}: QueueInput) {
  const today = byTime(attempts, true);
  if (current && !today.includes(current)) today.push(current);
  const earlier = byTime(attempts, false)
    .filter((id) => id !== current)
    .slice(-4);
  const taken = new Set(today);
  const recent = new Set(
    [...byTime(attempts, false), ...byTime(attempts, true)].slice(-3),
  );
  const upcoming: Pick[] = [];
  while (upcoming.length < size) {
    const next = pickNext(pool, attempts, seen, taken, recent);
    if (!next) break;
    taken.add(next.id);
    upcoming.push(next);
  }
  return { earlier, today, upcoming };
}
