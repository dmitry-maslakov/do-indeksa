import { clamp } from "es-toolkit";
import type { PartOutcome, StoredReveal } from "@/db/columns";

export const difficulties = [1, 2, 3, 4] as const;

export type Difficulty = (typeof difficulties)[number];

const easiest = difficulties[0];

export const hardest = difficulties[3];

export const difficultyOf = (label: number) =>
  clamp(label, easiest, hardest) as Difficulty;

export interface LoggedSubmit {
  at: number;
  outcomes: PartOutcome[];
  correct: boolean;
  difficulty: number;
  keyRev: string;
}

export interface StoredSubmit extends LoggedSubmit {
  id: string;
  answers: string[];
}

export interface LoggedReveal {
  at: number;
  part: StoredReveal;
}

export interface TaskLog<S extends LoggedSubmit = LoggedSubmit> {
  taskId: string;
  topic: string;
  type: string;
  difficulty: Difficulty;
  keyRev: string;
  tz: string | null;
  lastTz: string | null;
  submits: S[];
  reveals: LoggedReveal[];
  skips: number[];
}

export interface TaskLogs {
  firstAttempts: TaskLog[];
  taskLogs: TaskLog[];
}

export interface TaskActivity {
  taskId: string;
  topic: string;
  tz: string | null;
  at: number;
}

export type ObservationResult = "clean" | "helped" | "fail";

export type TryResult = "wrong" | "partlyRight" | "helped" | "clean";

export interface Try {
  at: number;
  result: TryResult;
}

export interface Observation {
  taskId: string;
  topic: string;
  type: string;
  at: number;
  day: string;
  difficulty: Difficulty;
  result: ObservationResult;
  credit: number;
}
