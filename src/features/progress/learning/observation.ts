import { isRight } from "@/db/columns";
import { dateIn } from "@/lib/dates";
import { defaultPolicy, type LearningPolicy } from "./policy";
import {
  difficultyOf,
  type FirstAttempt,
  type LoggedReveal,
  type LoggedSubmit,
  type Observation,
  type ObservationResult,
} from "./types";

const decides = ({ outcomes }: LoggedSubmit) =>
  outcomes.some((o) => o === "right" || o === "wrong");

const shareRight = ({ outcomes }: LoggedSubmit) =>
  outcomes.filter(isRight).length / outcomes.length;

const isHint = ({ part }: LoggedReveal) => part.startsWith("hint");

function firstSitting(
  { submits, reveals, skips }: FirstAttempt,
  now: number,
  gapMs: number,
) {
  const start = Math.min(
    ...submits.filter(decides).map((s) => s.at),
    ...reveals.filter((r) => !isHint(r)).map((r) => r.at),
  );
  const times = [
    ...submits.map((s) => s.at),
    ...reveals.map((r) => r.at),
    ...skips,
  ]
    .filter((at) => at >= start)
    .toSorted((a, b) => a - b);
  const gap = times.findIndex((at, i) => at - (times[i - 1] ?? at) >= gapMs);
  const end = times[gap] ?? Infinity;
  return {
    submits: submits
      .filter((s) => s.at < end && decides(s))
      .toSorted((a, b) => a.at - b.at),
    reveals: reveals.filter((r) => r.at < end),
    closed: gap >= 0 || now - (times.at(-1) ?? now) >= gapMs,
  };
}

export function observe(
  attempt: FirstAttempt,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): Observation | undefined {
  const { submits, reveals, closed } = firstSitting(
    attempt,
    now,
    policy.attemptGapMs,
  );
  const first = submits[0];
  if (!first || submits.some((s) => s.keyRev !== attempt.keyRev)) return;
  const shownAt = Math.min(
    ...reveals.filter((r) => !isHint(r)).map((r) => r.at),
  );
  if (shownAt < first.at) return;

  const outcome = (
    at: number,
    result: ObservationResult,
    credit: number,
  ): Observation => ({
    taskId: attempt.taskId,
    topic: attempt.topic,
    at,
    day: dateIn(at, attempt.tz),
    difficulty: difficultyOf(first.difficulty),
    result,
    credit,
  });

  const right = submits.find((s) => s.correct && s.at < shownAt);
  if (right) {
    const hinted = reveals.some((r) => isHint(r) && r.at < right.at);
    return right === first && !hinted
      ? outcome(right.at, "clean", 1)
      : outcome(right.at, "helped", policy.helpedCredit);
  }
  const last = submits.findLast((s) => s.at < shownAt) ?? first;
  const credit = policy.helpedCredit * shareRight(last);
  if (shownAt !== Infinity) return outcome(shownAt, "fail", credit);
  return closed ? outcome(last.at, "fail", credit) : undefined;
}
