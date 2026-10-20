import { describe, expect, it } from "vitest";
import { gradeTest } from "./grade";

const tasks = [
  { taskId: "a", expected: ["2"], points: 6 },
  { taskId: "b", expected: ["1", "3"], points: 6 },
  { taskId: "c", expected: ["5"], points: 6 },
];

describe("gradeTest", () => {
  const [a, b, c] = gradeTest(tasks, [["2"], ["1", "4"]]);

  it("credits each task by its right parts", () => {
    expect(a).toMatchObject({ outcomes: ["right"], correct: true, points: 6 });
    expect(b).toMatchObject({
      outcomes: ["right", "wrong"],
      correct: false,
      points: 3,
    });
  });

  it("keeps unreadable and empty parts apart from wrong ones", () => {
    const [d] = gradeTest(
      [{ taskId: "d", expected: ["1", "2", "3"], points: 6 }],
      [["1", "\\frac{2", ""]],
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
});
