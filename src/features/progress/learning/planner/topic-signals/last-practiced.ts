import { maxBy } from "es-toolkit";
import type { Learning } from "../../state";

export const lastPracticed = (learning: Learning) =>
  maxBy(
    [...learning].filter(([, t]) => t.status.lastAt !== null),
    ([, t]) => t.status.lastAt ?? 0,
  )?.[0];
