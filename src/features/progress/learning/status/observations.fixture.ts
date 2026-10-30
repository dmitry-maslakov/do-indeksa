import { hourMs } from "@/lib/dates";
import { defaultPolicy } from "../policy";
import type { Difficulty, Observation, ObservationResult } from "../types";

export const start = Date.parse("2026-10-01T09:00:00Z");

const credits: Record<ObservationResult, number> = {
  clean: 1,
  helped: defaultPolicy.helpedCredit,
  fail: 0,
};

export function obs(
  result: ObservationResult,
  { difficulty = 3, hours = 0 }: { difficulty?: Difficulty; hours?: number },
): Observation {
  const at = start + hours * hourMs;
  return {
    taskId: `t${hours}`,
    topic: "logarithms",
    at,
    day: new Date(at).toISOString().slice(0, 10),
    difficulty,
    result,
    credit: credits[result],
  };
}
