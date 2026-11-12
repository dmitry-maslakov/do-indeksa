import { describe, expect, it } from "vitest";
import type { Choice } from "@/features/catalog/choice";
import { gradeTest } from "./grade";

const written = (taskId: string, expected: string[]) => ({
  taskId,
  check: expected.map((e) => ({ expected: e })),
  choice: null,
});

const tasks = [
  written("a", ["2"]),
  written("b", ["1", "3"]),
  written("c", ["5"]),
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
      [written("d", ["1", "2", "3"])],
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

  it("grades a choice task by its options", () => {
    const choice: Choice = {
      many: true,
      options: ["a", "b", "c"],
      correct: ["A", "C"],
    };
    const [e] = gradeTest(
      [{ taskId: "e", check: [], choice }],
      [["A", "B", ""]],
    );
    expect(e).toMatchObject({
      outcomes: ["right", "wrong", "wrong"],
      correct: false,
      answered: true,
    });
  });
});
