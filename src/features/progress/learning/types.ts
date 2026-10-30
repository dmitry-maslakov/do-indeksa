import { clamp } from "es-toolkit";
import type { PartOutcome, StoredReveal } from "@/db/columns";

export type Difficulty = 1 | 2 | 3 | 4;

const easiest: Difficulty = 1;

export const hardest: Difficulty = 4;

export const difficultyOf = (label: number) =>
  clamp(label, easiest, hardest) as Difficulty;

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
