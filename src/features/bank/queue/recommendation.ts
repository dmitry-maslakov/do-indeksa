import type { placements } from "@/features/practice/practice-events";
import { signalNames } from "@/features/progress/learning/policy";

export const algoVersion = 2 as const;

export const pickReasons = [...signalNames, "repeat", "seen"] as const;

export type PickReason = (typeof pickReasons)[number];

export const recommendationOf = (
  surface: (typeof placements)[number],
  topic: string,
  pick?: { id: string; repeat?: boolean; reason?: PickReason },
  slot = 1,
) =>
  pick?.reason
    ? {
        surface,
        task_id: pick.id,
        topic,
        algo_version: algoVersion,
        repeat: Boolean(pick.repeat),
        reason: pick.reason,
        slot,
      }
    : undefined;
