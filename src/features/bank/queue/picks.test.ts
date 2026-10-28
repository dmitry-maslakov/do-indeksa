import { describe, expect, it } from "vitest";
import type { Touched } from "@/features/progress/status";
import { minuteMs } from "@/lib/dates";
import { planQueue } from "./picks";

const pool = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => ({
  id,
  exam: id === "e",
}));

const touch = (
  status: Touched["status"],
  minute: number,
  today = false,
): Touched => ({ status, at: new Date(minute * minuteMs), today });

describe("planQueue", () => {
  it("prefers exam tasks, then repeats an earlier mistake every fourth pick", () => {
    const touched = new Map([
      ["a", touch("wrong", 1)],
      ["b", touch("solved", 2)],
      ["c", touch("solved", 3)],
      ["d", touch("solved", 4)],
    ]);
    const queue = planQueue({ pool, touched, current: "f" });
    expect(queue.earlier).toEqual(["a", "b", "c", "d"]);
    expect(queue.today).toEqual(["f"]);
    expect(queue.upcoming).toEqual([
      { id: "e", repeat: false },
      { id: "g", repeat: false },
      { id: "a", repeat: true },
      { id: "h", repeat: false },
    ]);
  });

  it("splits touched tasks into earlier and today", () => {
    const touched = new Map([
      ["a", touch("solved", 1)],
      ["b", touch("wrong", 5, true)],
      ["c", touch("solved", 3, true)],
    ]);
    const queue = planQueue({ pool, touched, current: "c" });
    expect(queue.earlier).toEqual(["a"]);
    expect(queue.today).toEqual(["c", "b"]);
  });

  it("keeps tasks seen today in the list without offering them again", () => {
    const touched = new Map([
      ["a", touch(undefined, 1, true)],
      ["e", touch(undefined, 2, true)],
    ]);
    const queue = planQueue({ pool, touched, current: "b", size: 2 });
    expect(queue.today).toEqual(["a", "e", "b"]);
    expect(queue.upcoming.map((p) => p.id)).toEqual(["c", "d"]);
  });

  it("comes back to the task seen longest ago once all were seen", () => {
    const touched = new Map(
      pool.map((t, i) => [t.id, touch(undefined, i + 1)]),
    );
    const queue = planQueue({ pool, touched, current: "h", size: 1 });
    expect(queue.upcoming[0]?.id).toBe("a");
  });
});
