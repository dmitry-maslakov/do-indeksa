import type { Learning } from "../state";
import { start } from "../status/observations.fixture";
import { topicStatus } from "../status/topic-status";
import type { Difficulty, Observation } from "../types";
import type { Candidate } from "./contracts";

export const candidate = (
  taskId: string,
  difficulty: Difficulty,
  exam = false,
): Candidate => ({ taskId, topic: "logarithms", difficulty, exam });

export const learningAt = (
  ability: number,
  observations: Observation[] = [],
): Learning =>
  new Map([
    [
      "logarithms",
      {
        status: topicStatus(
          observations,
          observations.at(-1)?.at ?? null,
          start,
        ),
        ability,
      },
    ],
  ]);
