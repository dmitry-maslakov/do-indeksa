import { defaultPolicy, type LearningPolicy } from "../policy";
import type { Try, TryResult } from "../types";

const isSolved = (result: TryResult) =>
  result === "clean" || result === "helped";

export function intervalAfter(
  [first, ...repeats]: Try[],
  policy: LearningPolicy = defaultPolicy,
) {
  if (!first) return 0;
  if (repeats.length === 0) return policy.repeatAfterMs[first.result];
  const misses =
    repeats.length - 1 - repeats.findLastIndex((t) => isSolved(t.result));
  if (misses === 0) return policy.solvedRepeatAfterMs;
  return misses === 1 ? policy.missedRepeatAfterMs : policy.missedAgainAfterMs;
}
