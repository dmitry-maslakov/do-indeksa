import type { placements } from "@/features/practice/practice-events";

export const algoVersion = 1 as const;

export const recommendationOf = (
  surface: (typeof placements)[number],
  topic: string,
  pick?: { id: string; repeat?: boolean; fallback?: boolean },
  slot = 1,
) =>
  pick && !pick.fallback
    ? {
        surface,
        task_id: pick.id,
        topic,
        algo_version: algoVersion,
        repeat: Boolean(pick.repeat),
        slot,
      }
    : undefined;
