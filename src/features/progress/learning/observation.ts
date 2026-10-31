import { isRight } from "@/db/columns";
import { dateIn } from "@/lib/dates";
import { defaultPolicy, type LearningPolicy } from "./policy";
import {
  difficultyOf,
  type LoggedReveal,
  type LoggedSubmit,
  type Observation,
  type TaskLog,
} from "./types";

interface Sitting {
  submits: LoggedSubmit[];
  reveals: LoggedReveal[];
  closed: boolean;
}

const decides = ({ outcomes }: LoggedSubmit) =>
  outcomes.some((o) => o === "right" || o === "wrong");

const shareRight = ({ outcomes }: LoggedSubmit) =>
  outcomes.filter(isRight).length / outcomes.length;

const isHint = ({ part }: LoggedReveal) => part.startsWith("hint");

function sittingFrom(
  { submits, reveals, skips }: TaskLog,
  from: number,
  now: number,
  gapMs: number,
) {
  const start = Math.min(
    ...submits.filter((s) => s.at >= from && decides(s)).map((s) => s.at),
    ...reveals.filter((r) => r.at >= from && !isHint(r)).map((r) => r.at),
  );
  if (start === Infinity) return;
  const times = [
    ...submits.map((s) => s.at),
    ...reveals.map((r) => r.at),
    ...skips,
  ]
    .filter((at) => at >= start)
    .toSorted((a, b) => a - b);
  const gap = times.findIndex((at, i) => at - (times[i - 1] ?? at) >= gapMs);
  const end = times[gap] ?? Infinity;
  const within = (at: number) => at >= from && at < end;
  return {
    end,
    sitting: {
      submits: submits
        .filter((s) => within(s.at) && decides(s))
        .toSorted((a, b) => a.at - b.at),
      reveals: reveals.filter((r) => within(r.at)),
      closed: gap >= 0 || now - (times.at(-1) ?? now) >= gapMs,
    },
  };
}

export function sittings(
  log: TaskLog,
  now: number,
  gapMs: number,
  from = -Infinity,
): Sitting[] {
  const next = sittingFrom(log, from, now, gapMs);
  if (!next) return [];
  return [next.sitting, ...sittings(log, now, gapMs, next.end)];
}

type Outcome =
  | { at: number; result: "clean" | "helped" }
  | { at: number; result: "fail"; shareRight: number };

export type SittingResult = Outcome | { at: number; result: "studied" };

export function resultOf({
  submits,
  reveals,
  closed,
}: Sitting): SittingResult | undefined {
  const first = submits[0];
  const shownAt = Math.min(
    ...reveals.filter((r) => !isHint(r)).map((r) => r.at),
  );
  if (!first || shownAt < first.at) return { at: shownAt, result: "studied" };

  const right = submits.find((s) => s.correct && s.at < shownAt);
  if (right) {
    const hinted = reveals.some((r) => isHint(r) && r.at < right.at);
    const clean = right === first && !hinted;
    return { at: right.at, result: clean ? "clean" : "helped" };
  }
  const last = submits.findLast((s) => s.at < shownAt) ?? first;
  const shown = shownAt !== Infinity;
  if (!shown && !closed) return;
  return {
    at: shown ? shownAt : last.at,
    result: "fail",
    shareRight: shareRight(last),
  };
}

const creditOf = (judged: Outcome, policy: LearningPolicy) => {
  if (judged.result === "clean") return 1;
  if (judged.result === "fail") return policy.helpedCredit * judged.shareRight;
  return policy.helpedCredit;
};

export function observe(
  attempt: TaskLog,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): Observation | undefined {
  const [sitting] = sittings(attempt, now, policy.attemptGapMs);
  const first = sitting?.submits[0];
  if (!sitting || !first) return;
  if (sitting.submits.some((s) => s.keyRev !== attempt.keyRev)) return;
  const judged = resultOf(sitting);
  if (!judged || judged.result === "studied") return;
  return {
    taskId: attempt.taskId,
    topic: attempt.topic,
    at: judged.at,
    day: dateIn(judged.at, attempt.tz),
    difficulty: difficultyOf(first.difficulty),
    result: judged.result,
    credit: creditOf(judged, policy),
  };
}
