import { dayMs, minuteMs } from "@/lib/dates";
import type {
  LoggedReveal,
  LoggedSubmit,
  StoredSubmit,
  TaskLog,
} from "./types";

export const logStart = Date.parse("2026-10-20T10:00:00Z");

export const at = (minutes: number) => logStart + minutes * minuteMs;

export const days = (n: number) => (n * dayMs) / minuteMs;

export const submit = (
  minutes: number,
  outcomes: LoggedSubmit["outcomes"],
  keyRev = "k1",
): LoggedSubmit => ({
  at: at(minutes),
  outcomes,
  correct: outcomes.every((o) => o === "right"),
  difficulty: 3,
  keyRev,
});

export const stored = (
  minutes: number,
  outcomes: LoggedSubmit["outcomes"],
  answers: string[],
): StoredSubmit => ({
  ...submit(minutes, outcomes),
  id: `attempt-${minutes}`,
  answers,
});

export const reveal = (
  minutes: number,
  part: LoggedReveal["part"],
): LoggedReveal => ({ at: at(minutes), part });

export const taskLog = <S extends LoggedSubmit = LoggedSubmit>(
  over: Partial<TaskLog<S>>,
): TaskLog<S> => ({
  taskId: "t1",
  topic: "logarithms",
  type: "substitution",
  difficulty: 3,
  keyRev: "k1",
  tz: "Europe/Belgrade",
  lastTz: "Europe/Belgrade",
  submits: [],
  reveals: [],
  skips: [],
  ...over,
});
