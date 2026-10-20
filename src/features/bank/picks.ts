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
  current?: string;
  ordered: boolean;
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
  taken: Set<string>,
  recent: Set<string>,
): Pick | null {
  const open = pool.filter((t) => !taken.has(t.id));
  const wrong = open.filter(
    (t) => attempts.get(t.id)?.status === "wrong" && !recent.has(t.id),
  );
  if (taken.size % 4 === 3 && wrong[0])
    return { id: wrong[0].id, repeat: true };
  const fresh = open.filter((t) => !attempts.has(t.id));
  const next = fresh.find((t) => t.exam) ?? fresh[0];
  if (next) return { id: next.id, repeat: false };
  return wrong[0] ? { id: wrong[0].id, repeat: true } : null;
}

function inOrder(
  pool: PoolTask[],
  attempts: Map<string, Attempted>,
  current: string | undefined,
  size: number,
): Pick[] {
  const start = pool.findIndex((t) => t.id === current) + 1;
  const rest = [...pool.slice(start), ...pool.slice(0, start)].filter(
    (t) => t.id !== current,
  );
  const open = rest.filter((t) => attempts.get(t.id)?.status !== "solved");
  return (open.length ? open : rest)
    .slice(0, size)
    .map((t) => ({ id: t.id, repeat: false }));
}

export function planQueue({
  pool,
  attempts,
  current,
  ordered,
  size = 6,
}: QueueInput) {
  const today = byTime(attempts, true);
  if (current && !today.includes(current)) today.push(current);
  const earlier = byTime(attempts, false)
    .filter((id) => id !== current)
    .slice(-4);
  if (ordered) {
    return { earlier, today, upcoming: inOrder(pool, attempts, current, size) };
  }
  const taken = new Set(today);
  const recent = new Set(
    [...byTime(attempts, false), ...byTime(attempts, true)].slice(-3),
  );
  const upcoming: Pick[] = [];
  while (upcoming.length < size) {
    const next = pickNext(pool, attempts, taken, recent);
    if (!next) break;
    taken.add(next.id);
    upcoming.push(next);
  }
  return { earlier, today, upcoming };
}
