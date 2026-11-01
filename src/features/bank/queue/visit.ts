import { defaultPolicy } from "@/features/progress/learning/policy";
import type { Touch } from "@/features/progress/status";

export function visitOf(touches: Touch[], now: number) {
  const runs: Touch[][] = [];
  let end = -Infinity;
  for (const touch of touches.filter((t) => t.kind !== "mock")) {
    if (touch.from - end >= defaultPolicy.attemptGapMs) runs.push([]);
    runs.at(-1)?.push(touch);
    end = Math.max(end, touch.to);
  }
  return now - end < defaultPolicy.attemptGapMs ? (runs.at(-1) ?? []) : [];
}
