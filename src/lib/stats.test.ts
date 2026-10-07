import { describe, expect, it } from "vitest";
import {
  accuracyBy,
  meanTimeByNumber,
  type StatAttempt,
  totals,
} from "./stats";

const at = (
  taskId: string,
  number: number,
  correct: boolean,
  minutes: number,
): StatAttempt => ({
  taskId,
  number,
  topic: `t${number}`,
  correct,
  durationMs: minutes * 60_000,
  createdAt: new Date(0),
});

const newestFirst = [
  at("a", 1, true, 10),
  at("b", 1, false, 20),
  at("a", 1, false, 30),
  at("c", 2, true, 5),
];

describe("stats", () => {
  it("hides accuracy below the sample minimum", () => {
    expect(accuracyBy(newestFirst, [1, 2, 3], (a) => a.number)).toEqual([
      { key: 1, total: 3, pct: 33 },
      { key: 2, total: 1, pct: null },
      { key: 3, total: 0, pct: null },
    ]);
  });

  it("averages time per number", () => {
    expect(meanTimeByNumber(newestFirst, [1, 3])).toEqual([
      { number: 1, meanMs: 20 * 60_000 },
      { number: 3, meanMs: null },
    ]);
  });

  it("counts latest statuses and first tries", () => {
    expect(totals(newestFirst)).toEqual({
      solved: 2,
      wrong: 1,
      firstTryPct: 33,
      spentMs: 65 * 60_000,
    });
  });
});
