import { describe, expect, it } from "vitest";
import { review, reviewHref } from "./review";

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
    {
      taskId: "a",
      outcomes: ["right"],
      correct: true,
      durationMs: 10 * 60_000,
    },
    {
      taskId: "b",
      outcomes: ["right", "wrong"],
      correct: false,
      durationMs: 30 * 60_000,
    },
    { taskId: "c", outcomes: ["wrong"], correct: false, durationMs: 60_000 },
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

describe("reviewHref", () => {
  it("links to the first eight characters of the test id", () => {
    expect(reviewHref("0a1b2c3d-4e5f-6789-abcd-ef0123456789")).toBe(
      "/review/0a1b2c3d",
    );
  });
});
