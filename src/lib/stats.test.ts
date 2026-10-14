import { describe, expect, it } from "vitest";
import {
  accuracyBy,
  meanTimeByNumber,
  mistakes,
  type StatAttempt,
  streak,
  totals,
  warming,
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

  it("counts consecutive days up to today or yesterday", () => {
    expect(
      streak(["2026-10-07", "2026-10-06", "2026-10-05", "2026-10-03"], now),
    ).toBe(3);
    expect(streak(["2026-10-06", "2026-10-05"], now)).toBe(2);
    expect(streak(["2026-10-04"], now)).toBe(0);
    expect(streak([], now)).toBe(0);
  });

  it("counts each day once", () => {
    expect(streak(["2026-10-07", "2026-10-07", "2026-10-06"], now)).toBe(2);
  });

  it("steps back by calendar days across a clock change", () => {
    const late = new Date("2026-10-26T22:30:00Z");
    expect(streak(["2026-10-26", "2026-10-25", "2026-10-24"], late)).toBe(3);
    const early = new Date("2026-03-30T22:30:00Z");
    expect(streak(["2026-03-30", "2026-03-29", "2026-03-28"], early)).toBe(3);
  });

  it("lists tasks whose latest attempt is wrong", () => {
    const rows = [
      day(1, { taskId: "a", correct: true }),
      day(2, { taskId: "a" }),
      day(3, { taskId: "b" }),
      day(9, { taskId: "c" }),
    ];
    expect(mistakes(rows)).toEqual(["b", "c"]);
  });

  const topicRows = [
    ...[1, 2, 3].map((n) => day(n, { topic: "x", correct: n === 1 })),
    ...[1, 2, 3].map((n) => day(n, { topic: "y", correct: true })),
    day(1, { topic: "z" }),
    ...[40, 41, 42].map((n) => day(n, { topic: "w" })),
  ];

  it("ranks the weakest topics with enough attempts", () => {
    expect(
      weakest(topicRows, ["w", "x", "y", "z"], now).map((a) => a.key),
    ).toEqual(["x", "y"]);
  });

  it("lists recent topics below the sample minimum", () => {
    const rows = [...topicRows, day(2, { topic: "v" }), day(5, { topic: "v" })];
    expect(warming(rows, ["u", "v", "w", "x", "y", "z"], now)).toEqual([
      { key: "v", total: 2, pct: null },
      { key: "z", total: 1, pct: null },
    ]);
  });
});
