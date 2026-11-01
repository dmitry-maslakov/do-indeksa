import { resultOf, type SittingResult, sittings } from "../observation";
import { defaultPolicy, type LearningPolicy } from "../policy";
import type { TaskLog, Try, TryResult } from "../types";
import { isSolved } from "./schedule";

function tryResult(judged: SittingResult): TryResult {
  if (judged.result === "clean" || judged.result === "helped")
    return judged.result;
  return judged.result === "fail" && judged.shareRight > 0
    ? "partlyRight"
    : "wrong";
}

export function tries(
  log: TaskLog,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): Try[] {
  const found: Try[] = [];
  for (const sitting of sittings(log, now, policy.attemptGapMs)) {
    const judged = resultOf(sitting);
    if (!judged) continue;
    const last = found.at(-1);
    if (judged.result === "studied" && last && isSolved(last.result)) continue;
    found.push({ at: judged.at, result: tryResult(judged) });
  }
  return found;
}
