import { describe, expect, it } from "vitest";
import { minuteMs } from "@/lib/dates";
import {
  accuracyBy,
  meanTimeByNumber,
  type TaskStat,
  totals,
  weakest,
} from "./stats";

const minutes = (count: number) => count * minuteMs;

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
  lastAt: 0,
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
});
