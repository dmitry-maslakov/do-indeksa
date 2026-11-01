import { isRight, type StoredReveal } from "@/db/columns";
import { firstShown, isHint, sittings } from "./observation";
import type {
  LoggedReveal,
  LoggedSubmit,
  StoredSubmit,
  TaskLog,
} from "./types";

export interface SittingState {
  hints: number;
  answer: boolean;
  solution: boolean;
  correct: boolean;
  solved: (string | undefined)[];
}

export const openSitting: SittingState = {
  hints: 0,
  answer: false,
  solution: false,
  correct: false,
  solved: [],
};

export const isLocked = ({ correct, answer, solution }: SittingState) =>
  correct || answer || solution;

const hintsOf = (reveals: LoggedReveal[]) =>
  new Set(reveals.filter(isHint).map((r) => r.part)).size;

export function sittingState(
  log: TaskLog<StoredSubmit>,
  now: number,
  gapMs: number,
): SittingState {
  const current = sittings(log, now, gapMs).at(-1);
  if (!current || current.closed)
    return {
      ...openSitting,
      hints: hintsOf(log.reveals.filter((r) => now - r.at < gapMs)),
    };
  const shownAt = firstShown(current.reveals);
  const before = current.submits.filter(
    (s) => s.at < shownAt && s.keyRev === log.keyRev,
  );
  const done = before.find((s) => s.correct) ?? before.at(-1);
  const opened = (part: StoredReveal) =>
    current.reveals.some((r) => r.part === part);
  return {
    hints: hintsOf(current.reveals),
    answer: opened("answer"),
    solution: opened("solution"),
    correct: done?.correct ?? false,
    solved:
      done?.outcomes.map((outcome, i) =>
        isRight(outcome) ? done.answers[i] : undefined,
      ) ?? [],
  };
}

export function afterShown<S extends LoggedSubmit>(
  log: TaskLog<S>,
  now: number,
  gapMs: number,
) {
  return sittings(log, now, gapMs).flatMap(({ submits, reveals }) => {
    const shownAt = firstShown(reveals);
    return submits.filter((s) => s.at > shownAt);
  });
}
