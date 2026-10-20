import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { gradeRun } from "./grade";

const tasks = [
  { taskId: "a", expected: ["2"], points: 6 },
  { taskId: "b", expected: ["1", "3"], points: 6 },
  { taskId: "c", expected: ["5"], points: 6 },
];

describe("gradeRun", () => {
  const [a, b, c] = gradeRun(tasks, [["2"], ["1", "4"]], [60_000, 2 * dayMs]);

  it("credits each task by its right parts", () => {
    expect(a).toMatchObject({ outcomes: ["right"], correct: true, points: 6 });
    expect(b).toMatchObject({
      outcomes: ["right", "wrong"],
      correct: false,
      points: 3,
    });
  });

  it("keeps unreadable and empty parts apart from wrong ones", () => {
    const [d] = gradeRun(
      [{ taskId: "d", expected: ["1", "2", "3"], points: 6 }],
      [["1", "\\frac{2", ""]],
      [0],
    );
    expect(d).toMatchObject({
      outcomes: ["right", "unreadable", "empty"],
      correct: false,
      points: 2,
    });
  });

  it("marks unanswered tasks", () => {
    expect([a?.answered, b?.answered, c?.answered]).toEqual([
      true,
      true,
      false,
    ]);
    expect(c).toMatchObject({ answers: [], points: 0 });
  });

  it("caps durations at a day", () => {
    expect([a?.durationMs, b?.durationMs, c?.durationMs]).toEqual([
      60_000,
      dayMs,
      0,
    ]);
  });

  it("keeps the time spent on a skipped task", () => {
    const [, skipped] = gradeRun(tasks, [["2"]], [60_000, 20 * 60_000]);
    expect(skipped).toMatchObject({ answered: false, durationMs: 20 * 60_000 });
  });
});
