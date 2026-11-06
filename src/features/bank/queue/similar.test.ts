import { describe, expect, it } from "vitest";
import type { Candidate } from "@/features/progress/learning/planner/contracts";
import type { Difficulty } from "@/features/progress/learning/types";
import type { Answered } from "@/features/progress/status";
import { similarPool } from "./similar";

const task = (taskId: string, type: string, difficulty: Difficulty) => ({
  taskId,
  topic: "exponential-equations",
  type,
  difficulty,
  exam: false,
});

const shown = task("a", "substitution", 2);

const ids = (pool: Candidate[]) => pool.map((t) => t.taskId);

const statuses = (entries: [string, Answered][] = []) => new Map(entries);

describe("similarPool", () => {
  it("keeps the same type at a level around the task", () => {
    const pool = [
      shown,
      task("b", "substitution", 1),
      task("c", "substitution", 4),
      task("d", "same-base", 2),
    ];
    expect(ids(similarPool(shown, pool, statuses()))).toEqual(["b"]);
  });

  it("leaves out the solved tasks but keeps the wrong ones", () => {
    const pool = [
      shown,
      task("b", "substitution", 2),
      task("c", "substitution", 3),
    ];
    expect(
      ids(
        similarPool(
          shown,
          pool,
          statuses([
            ["b", "solved"],
            ["c", "wrong"],
          ]),
        ),
      ),
    ).toEqual(["c"]);
  });

  it("widens to any level of the type, then the topic", () => {
    const far = task("c", "substitution", 4);
    const other = task("d", "same-base", 3);
    expect(ids(similarPool(shown, [shown, far, other], statuses()))).toEqual([
      "c",
    ]);
    expect(ids(similarPool(shown, [shown, other], statuses()))).toEqual(["d"]);
    expect(
      ids(similarPool(shown, [shown, task("e", "same-base", 4)], statuses())),
    ).toEqual(["e"]);
  });

  it("is empty when the whole topic is solved", () => {
    const pool = [shown, task("b", "substitution", 2)];
    expect(similarPool(shown, pool, statuses([["b", "solved"]]))).toEqual([]);
  });
});
