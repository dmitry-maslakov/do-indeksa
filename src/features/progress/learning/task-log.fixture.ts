import { dayMs, minuteMs } from "@/lib/dates";
import type { LoggedReveal, LoggedSubmit, TaskLog } from "./types";

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

export const reveal = (
  minutes: number,
  part: LoggedReveal["part"],
): LoggedReveal => ({ at: at(minutes), part });

export const taskLog = (over: Partial<TaskLog>): TaskLog => ({
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
