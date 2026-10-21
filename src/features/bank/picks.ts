import type { Touched } from "@/features/progress/status";

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
  touched: Map<string, Touched>;
  current?: string;
  size?: number;
}

const byTime = (touched: Map<string, Touched>, today: boolean) =>
  [...touched]
    .filter(([, t]) => t.today === today)
    .sort(([, a], [, b]) => a.at.getTime() - b.at.getTime())
    .map(([id]) => id);

function pickNext(
  pool: PoolTask[],
  touched: Map<string, Touched>,
  taken: Set<string>,
  recent: Set<string>,
): Pick | null {
  const open = pool.filter((t) => !taken.has(t.id));
  const wrong = open.filter(
    (t) => touched.get(t.id)?.status === "wrong" && !recent.has(t.id),
  );
  if (taken.size % 4 === 3 && wrong[0])
    return { id: wrong[0].id, repeat: true };
  const fresh = open.filter((t) => !touched.has(t.id));
  const seen = open
    .filter((t) => touched.has(t.id) && !touched.get(t.id)?.status)
    .sort(
      (a, b) =>
        (touched.get(a.id)?.at.getTime() ?? 0) -
        (touched.get(b.id)?.at.getTime() ?? 0),
    );
  const next = fresh.find((t) => t.exam) ?? fresh[0] ?? seen[0];
  if (next) return { id: next.id, repeat: false };
  return wrong[0] ? { id: wrong[0].id, repeat: true } : null;
}

export function planQueue({ pool, touched, current, size = 6 }: QueueInput) {
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
  while (upcoming.length < size) {
    const next = pickNext(pool, touched, taken, recent);
    if (!next) break;
    taken.add(next.id);
    upcoming.push(next);
  }
  return { earlier, today, upcoming };
}
