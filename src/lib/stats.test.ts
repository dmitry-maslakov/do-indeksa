import { describe, expect, it } from "vitest";
import {
  accuracyBy,
  meanTimeByNumber,
  mistakesThisWeek,
  type StatAttempt,
  streak,
  totals,
  weakest,
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

describe("home folds", () => {
  const now = new Date("2026-10-07T10:00:00Z");
  const day = (n: number, extra: Partial<StatAttempt> = {}) => ({
    ...at("a", 1, false, 1),
    createdAt: new Date(now.getTime() - n * 24 * 60 * 60 * 1000),
    ...extra,
  });

  it("counts consecutive Belgrade days up to today or yesterday", () => {
    expect(streak([day(0), day(1), day(2), day(4)], now)).toBe(3);
    expect(streak([day(1), day(2)], now)).toBe(2);
    expect(streak([day(3)], now)).toBe(0);
  });

  it("lists tasks whose latest attempt this week is wrong", () => {
    const rows = [
      day(1, { taskId: "a", correct: true }),
      day(2, { taskId: "a" }),
      day(3, { taskId: "b" }),
      day(9, { taskId: "c" }),
    ];
    expect(mistakesThisWeek(rows, now)).toEqual(["b"]);
  });

  it("ranks the weakest topics with enough attempts", () => {
    const rows = [
      ...[1, 2, 3].map((n) => day(n, { topic: "x", correct: n === 1 })),
      ...[1, 2, 3].map((n) => day(n, { topic: "y", correct: true })),
      day(1, { topic: "z" }),
      ...[40, 41, 42].map((n) => day(n, { topic: "w" })),
    ];
    expect(weakest(rows, ["w", "x", "y", "z"], now).map((a) => a.key)).toEqual([
      "x",
      "y",
    ]);
  });
});
