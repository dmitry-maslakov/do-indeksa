import { describe, expect, it } from "vitest";
import { review } from "./review";

const task = (taskId: string, topic: string) => ({
  taskId,
  number: 1,
  topic,
  points: 6,
  minutes: 24,
});

const tasks = [
  task("a", "logs"),
  task("b", "logs"),
  task("c", "trig"),
  task("d", "trig"),
];

describe("review", () => {
  const result = review(tasks, [
    { taskId: "a", parts: [true], correct: true, durationMs: 10 * 60_000 },
    {
      taskId: "b",
      parts: [true, false],
      correct: false,
      durationMs: 30 * 60_000,
    },
    { taskId: "c", parts: [false], correct: false, durationMs: 60_000 },
  ]);

  it("credits correct parts", () => {
    expect(result.score).toBe(9);
    expect(result.max).toBe(24);
    expect(result.correct).toBe(1);
  });

  it("marks segments and overtime", () => {
    expect(result.rows.map((r) => r.segment)).toEqual([
      "done",
      "partial",
      "error",
      "none",
    ]);
    expect(result.rows.map((r) => r.over)).toEqual([false, true, false, false]);
  });

  it("groups lost points by topic with skipped tasks apart", () => {
    expect(result.lost).toEqual([
      { topic: "trig", points: 6 },
      { topic: null, points: 6 },
      { topic: "logs", points: 3 },
    ]);
  });

  it("sums time against the norm", () => {
    expect(result.spentMs).toBe(41 * 60_000);
    expect(result.normMs).toBe(96 * 60_000);
  });
});
