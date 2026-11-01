import { isPractice } from "@/db/columns";
import type { Touch } from "@/features/progress/status";
import { hourMs } from "@/lib/dates";

export const railGapMs = 4 * hourMs;

export function sessionsOf(touches: Touch[]) {
  const runs: Touch[][] = [];
  let end = -Infinity;
  for (const touch of touches.filter(isPractice)) {
    if (touch.from - end >= railGapMs) runs.push([]);
    runs.at(-1)?.push(touch);
    end = Math.max(end, touch.to);
  }
  return { runs, end };
}

export function visitOf(touches: Touch[], now: number) {
  const { runs, end } = sessionsOf(touches);
  return now - end < railGapMs ? (runs.at(-1) ?? []) : [];
}

export function earlierRuns(touches: Touch[], now: number) {
  const { runs, end } = sessionsOf(touches);
  return now - end < railGapMs ? runs.slice(0, -1) : runs;
}
