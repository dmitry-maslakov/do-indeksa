import { describe, expect, it } from "vitest";
import { gradeTest } from "./grade";

const tasks = [
  { taskId: "a", expected: ["2"] },
  { taskId: "b", expected: ["1", "3"] },
  { taskId: "c", expected: ["5"] },
];

describe("gradeTest", () => {
  const [a, b, c] = gradeTest(tasks, [["2"], ["1", "4"]]);

  it("grades each part of each task", () => {
    expect(a).toMatchObject({ outcomes: ["right"], correct: true });
    expect(b).toMatchObject({
      outcomes: ["right", "wrong"],
      correct: false,
    });
  });

  it("keeps unreadable and empty parts apart from wrong ones", () => {
    const [d] = gradeTest(
      [{ taskId: "d", expected: ["1", "2", "3"] }],
      [["1", "\\frac{2", ""]],
    );
    expect(d).toMatchObject({
      outcomes: ["right", "unreadable", "empty"],
      correct: false,
    });
  });

  it("marks unanswered tasks", () => {
    expect([a?.answered, b?.answered, c?.answered]).toEqual([
      true,
      true,
      false,
    ]);
    expect(c).toMatchObject({ answers: [] });
  });
});
