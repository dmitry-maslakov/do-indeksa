import { describe, expect, it } from "vitest";
import {
  candidate,
  learningAt,
} from "@/features/progress/learning/planner/learning.fixture";
import type { Touched } from "@/features/progress/status";
import { minuteMs } from "@/lib/dates";
import { planQueue } from "./picks";

const pool = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) =>
  candidate(id, 2, id === "e"),
);

const learning = learningAt(-1);

const touch = (
  status: Touched["status"],
  minute: number,
  today = false,
): Touched => ({ status, at: new Date(minute * minuteMs), today });

describe("planQueue", () => {
  it("prefers exam tasks at the same level, then repeats an earlier mistake every fourth pick", () => {
    const touched = new Map([
      ["a", touch("wrong", 1)],
      ["b", touch("solved", 2)],
      ["c", touch("solved", 3)],
      ["d", touch("solved", 4)],
    ]);
    const queue = planQueue({ pool, learning, touched, current: "f" });
    expect(queue.earlier).toEqual(["a", "b", "c", "d"]);
    expect(queue.today).toEqual(["f"]);
    expect(queue.upcoming).toEqual([
      { id: "e", repeat: false, reason: "levelFit" },
      { id: "g", repeat: false, reason: "levelFit" },
      { id: "a", repeat: true, reason: "repeat" },
      { id: "h", repeat: false, reason: "levelFit" },
    ]);
  });

  it("picks new tasks at the student's level", () => {
    const levels = [
      candidate("d1", 1, true),
      candidate("d2", 2),
      candidate("d3", 3),
      candidate("d4", 4),
    ];
    const ids = (ability: number) =>
      planQueue({
        pool: levels,
        learning: learningAt(ability),
        touched: new Map(),
        size: 2,
      }).upcoming.map((p) => p.id);
    expect(ids(-1.5)).toEqual(["d1", "d2"]);
    expect(ids(0.8)).toEqual(["d3", "d4"]);
  });

  it("splits touched tasks into earlier and today", () => {
    const touched = new Map([
      ["a", touch("solved", 1)],
      ["b", touch("wrong", 5, true)],
      ["c", touch("solved", 3, true)],
    ]);
    const queue = planQueue({ pool, learning, touched, current: "c" });
    expect(queue.earlier).toEqual(["a"]);
    expect(queue.today).toEqual(["c", "b"]);
  });

  it("keeps tasks seen today in the list without offering them again", () => {
    const touched = new Map([
      ["a", touch(undefined, 1, true)],
      ["e", touch(undefined, 2, true)],
    ]);
    const queue = planQueue({ pool, learning, touched, current: "b", size: 2 });
    expect(queue.today).toEqual(["a", "e", "b"]);
    expect(queue.upcoming.map((p) => p.id)).toEqual(["c", "d"]);
  });

  it("comes back to the task seen longest ago once all were seen", () => {
    const touched = new Map(
      pool.map((t, i) => [t.taskId, touch(undefined, i + 1)]),
    );
    const queue = planQueue({ pool, learning, touched, current: "h", size: 1 });
    expect(queue.upcoming[0]).toEqual({
      id: "a",
      repeat: false,
      reason: "seen",
    });
  });
});
