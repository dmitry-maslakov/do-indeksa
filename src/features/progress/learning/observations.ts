import { isRight, type PartOutcome, type StoredReveal } from "@/db/columns";
import { dateIn } from "@/lib/dates";
import {
  attemptGapMs,
  type Difficulty,
  difficultyOf,
  helpedCredit,
} from "./constants";

export interface LoggedSubmit {
  at: number;
  outcomes: PartOutcome[];
  correct: boolean;
  difficulty: number;
  keyRev: string;
}

export interface LoggedReveal {
  at: number;
  part: StoredReveal;
}

export interface FirstAttempt {
  taskId: string;
  topic: string;
  keyRev: string;
  tz: string | null;
  submits: LoggedSubmit[];
  reveals: LoggedReveal[];
  skips: number[];
}

export type ObservationResult = "clean" | "helped" | "fail";

export interface Observation {
  taskId: string;
  topic: string;
  at: number;
  day: string;
  difficulty: Difficulty;
  result: ObservationResult;
  credit: number;
}

const decides = (submit: LoggedSubmit) =>
  submit.outcomes.some((o) => o === "right" || o === "wrong");

const shareRight = ({ outcomes }: LoggedSubmit) =>
  outcomes.filter(isRight).length / outcomes.length;

const isHint = (reveal: LoggedReveal) => reveal.part.startsWith("hint");

function firstSitting({ submits, reveals, skips }: FirstAttempt) {
  const work = [...submits.map((s) => s.at), ...reveals.map((r) => r.at)];
  const start = Math.min(...work);
  const times = [...work, ...skips.filter((at) => at > start)].toSorted(
    (a, b) => a - b,
  );
  const gap = times.findIndex(
    (at, i) => at - (times[i - 1] ?? at) >= attemptGapMs,
  );
  const end = times[gap] ?? Infinity;
  return {
    submits: submits
      .filter((s) => s.at < end && decides(s))
      .toSorted((a, b) => a.at - b.at),
    reveals: reveals.filter((r) => r.at < end),
    lastAt: gap < 0 ? times.at(-1) : times[gap - 1],
    closed: gap >= 0,
  };
}

export function observe(
  attempt: FirstAttempt,
  now: number,
): Observation | undefined {
  const sitting = firstSitting(attempt);
  const { submits, reveals } = sitting;
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
      : outcome(right.at, "helped", helpedCredit);
  }
  const last = submits.findLast((s) => s.at < shownAt) ?? first;
  const credit = helpedCredit * shareRight(last);
  if (shownAt !== Infinity) return outcome(shownAt, "fail", credit);
  const closed =
    sitting.closed || now - (sitting.lastAt ?? now) >= attemptGapMs;
  return closed ? outcome(last.at, "fail", credit) : undefined;
}
