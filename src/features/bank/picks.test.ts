import { describe, expect, it } from "vitest";
import type { Attempted } from "@/features/progress/status";
import { planQueue } from "./picks";

const pool = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => ({
  id,
  exam: id === "e",
}));

const attempt = (
  status: Attempted["status"],
  minute: number,
  today = false,
): Attempted => ({ status, at: new Date(minute * 60_000), today });

describe("planQueue", () => {
  it("keeps bank order for guests", () => {
    const { upcoming } = planQueue({
      pool,
      attempts: new Map(),
      current: "c",
      ordered: true,
      size: 3,
    });
    expect(upcoming.map((p) => p.id)).toEqual(["d", "e", "f"]);
  });

  it("walks a list of solved tasks in order", () => {
    const attempts = new Map(pool.map((t) => [t.id, attempt("solved", 1)]));
    const { upcoming } = planQueue({
      pool,
      attempts,
      current: "g",
      ordered: true,
      size: 2,
    });
    expect(upcoming.map((p) => p.id)).toEqual(["h", "a"]);
  });

  it("prefers exam tasks, then repeats an earlier mistake every fourth pick", () => {
    const attempts = new Map([
      ["a", attempt("wrong", 1)],
      ["b", attempt("solved", 2)],
      ["c", attempt("solved", 3)],
      ["d", attempt("solved", 4)],
    ]);
    const queue = planQueue({ pool, attempts, current: "f", ordered: false });
    expect(queue.earlier).toEqual(["a", "b", "c", "d"]);
    expect(queue.today).toEqual(["f"]);
    expect(queue.upcoming).toEqual([
      { id: "e", repeat: false },
      { id: "g", repeat: false },
      { id: "a", repeat: true },
      { id: "h", repeat: false },
    ]);
  });

  it("splits attempts into earlier and today", () => {
    const attempts = new Map([
      ["a", attempt("solved", 1)],
      ["b", attempt("wrong", 5, true)],
      ["c", attempt("solved", 3, true)],
    ]);
    const queue = planQueue({ pool, attempts, current: "c", ordered: false });
    expect(queue.earlier).toEqual(["a"]);
    expect(queue.today).toEqual(["c", "b"]);
  });
});
