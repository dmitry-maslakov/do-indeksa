import { describe, expect, it } from "vitest";
import {
  accuracyBy,
  meanTimeByNumber,
  mistakes,
  streak,
  type TaskStat,
  totals,
  warming,
  weakest,
} from "./stats";

const minutes = (count: number) => count * 60_000;

const stat = (
  taskId: string,
  number: number,
  extra: Partial<TaskStat> = {},
): TaskStat => ({
  taskId,
  number,
  topic: `t${number}`,
  attempts: 1,
  right: 0,
  recentAttempts: 0,
  recentRight: 0,
  durationMs: 0,
  firstRight: false,
  latestRight: false,
  ...extra,
});

const stats = [
  stat("a", 1, {
    attempts: 2,
    right: 1,
    durationMs: minutes(40),
    latestRight: true,
  }),
  stat("b", 1, { durationMs: minutes(20) }),
  stat("c", 2, {
    right: 1,
    durationMs: minutes(5),
    firstRight: true,
    latestRight: true,
  }),
];

describe("stats", () => {
  it("hides accuracy below the sample minimum", () => {
    expect(accuracyBy(stats, [1, 2, 3], (s) => s.number)).toEqual([
      { key: 1, total: 3, pct: 33 },
      { key: 2, total: 1, pct: null },
      { key: 3, total: 0, pct: null },
    ]);
  });

  it("averages time per number", () => {
    expect(meanTimeByNumber(stats, [1, 3])).toEqual([
      { number: 1, meanMs: minutes(20) },
      { number: 3, meanMs: null },
    ]);
  });

  it("counts latest statuses and first tries", () => {
    expect(totals(stats)).toEqual({
      solved: 2,
      wrong: 1,
      firstTryPct: 33,
      spentMs: minutes(65),
    });
  });

  it("has no first tries without attempts", () => {
    expect(totals([]).firstTryPct).toBeNull();
  });
});

describe("home folds", () => {
  const now = new Date("2026-10-07T10:00:00Z");

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
      stat("a", 1, { latestRight: true }),
      stat("b", 1),
      stat("c", 1),
    ];
    expect(mistakes(rows)).toEqual(["b", "c"]);
  });

  const recent = (
    taskId: string,
    topic: string,
    recentAttempts: number,
    recentRight: number,
  ) => stat(taskId, 1, { topic, recentAttempts, recentRight });

  const topicRows = [
    recent("x1", "x", 2, 1),
    recent("x2", "x", 1, 0),
    recent("y1", "y", 3, 3),
    recent("z1", "z", 1, 0),
    stat("w1", 1, { topic: "w", attempts: 3 }),
  ];

  it("ranks the weakest topics with enough attempts", () => {
    expect(weakest(topicRows, ["w", "x", "y", "z"]).map((a) => a.key)).toEqual([
      "x",
      "y",
    ]);
  });

  it("lists recent topics below the sample minimum", () => {
    const rows = [...topicRows, recent("v1", "v", 2, 1)];
    expect(warming(rows, ["u", "v", "w", "x", "y", "z"])).toEqual([
      { key: "v", total: 2, pct: null },
      { key: "z", total: 1, pct: null },
    ]);
  });
});
