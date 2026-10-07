import { describe, expect, it } from "vitest";
import { DAY, gradeRun } from "./grade";

const tasks = [
  { taskId: "a", expected: ["2"], points: 6 },
  { taskId: "b", expected: ["1", "3"], points: 6 },
  { taskId: "c", expected: ["5"], points: 6 },
];

describe("gradeRun", () => {
  const [a, b, c] = gradeRun(tasks, [["2"], ["1", "4"]], [60_000, 2 * DAY]);

  it("credits each task by its right parts", () => {
    expect(a).toMatchObject({ parts: [true], correct: true, points: 6 });
    expect(b).toMatchObject({
      parts: [true, false],
      correct: false,
      points: 3,
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
      DAY,
      0,
    ]);
  });
});
