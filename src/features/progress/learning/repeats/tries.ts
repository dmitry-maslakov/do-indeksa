import { resultOf, type SittingResult, sittings } from "../observation";
import { defaultPolicy, type LearningPolicy } from "../policy";
import type { TaskLog, Try, TryResult } from "../types";

function tryResult(judged: SittingResult): TryResult {
  if (judged.result === "clean" || judged.result === "helped")
    return judged.result;
  return judged.result === "fail" && judged.shareRight > 0
    ? "partlyRight"
    : "wrong";
}

export const tries = (
  log: TaskLog,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): Try[] =>
  sittings(log, now, policy.attemptGapMs).flatMap((sitting) => {
    const judged = resultOf(sitting);
    return judged ? { at: judged.at, result: tryResult(judged) } : [];
  });
