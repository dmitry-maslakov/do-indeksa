import { describe, expect, it } from "vitest";
import {
  abilityAt,
  candidate,
  history,
  learningAt,
} from "@/features/progress/learning/planner/learning.fixture";
import type { TaskHistory } from "@/features/progress/learning/state";
import { start as now } from "@/features/progress/learning/status/observations.fixture";
import type { Touched } from "@/features/progress/status";
import { dayMs, minuteMs } from "@/lib/dates";
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

const repeats = (tasks: Record<string, TaskHistory>) =>
  learningAt(-1, [], tasks);

const ids = (picks: { id: string }[]) => picks.map((p) => p.id);

describe("planQueue", () => {
  it("mixes due repeats into new tasks, at most two in every six", () => {
    const touched = new Map([
      ["a", touch("wrong", 1)],
      ["b", touch("solved", 2)],
      ["c", touch("solved", 3)],
      ["d", touch("wrong", 4)],
    ]);
    const queue = planQueue({
      pool,
      learning: repeats({
        a: history({ dueAt: now - 2 * dayMs }),
        b: history({ lastResult: "clean", dueAt: now - dayMs }),
        c: history({ lastResult: "helped", dueAt: now + dayMs }),
        d: history({ lastResult: "partlyRight", dueAt: now - dayMs }),
      }),
      touched,
      now,
      size: 7,
    });
    expect(queue.earlier).toEqual(["a", "b", "c", "d"]);
    expect(queue.upcoming).toEqual([
      { id: "a", repeat: true, reason: "repeatDue" },
      { id: "d", repeat: true, reason: "repeatDue" },
      { id: "e", repeat: false, reason: "levelFit" },
      { id: "f", repeat: false, reason: "levelFit" },
      { id: "g", repeat: false, reason: "levelFit" },
      { id: "h", repeat: false, reason: "levelFit" },
      { id: "b", repeat: true, reason: "repeatDue" },
    ]);
  });

  it("counts today's repeats toward the limit", () => {
    const touched = new Map([
      ["a", touch("solved", 1, true)],
      ["b", touch(undefined, 2, true)],
      ["c", touch("wrong", 0)],
    ]);
    const queue = planQueue({
      pool,
      learning: repeats({
        a: history({ tries: 2, lastResult: "clean", dueAt: now + dayMs }),
        b: history(),
        c: history(),
      }),
      touched,
      now,
      current: "b",
    });
    expect(ids(queue.upcoming)).toEqual(["e", "d", "f", "g", "c", "h"]);
  });

  it("doesn't bring a mistake back before it is due", () => {
    const touched = new Map([["a", touch("wrong", 1)]]);
    const queue = planQueue({
      pool,
      learning: repeats({ a: history({ dueAt: now + 1 }) }),
      touched,
      now,
      size: 8,
    });
    expect(ids(queue.upcoming)).not.toContain("a");
    expect(queue.upcoming).toHaveLength(7);
  });

  it("brings a task studied without an answer back on its schedule", () => {
    const touched = new Map(
      pool.map((t, i) => [t.taskId, touch(undefined, i + 1)]),
    );
    const queue = planQueue({
      pool,
      learning: repeats({
        a: history({ dueAt: now - dayMs }),
        b: history({ dueAt: now + dayMs }),
      }),
      touched,
      now,
      size: 2,
    });
    expect(queue.upcoming).toEqual([
      { id: "a", repeat: true, reason: "repeatDue" },
      { id: "c", repeat: false, reason: "seen" },
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
        now,
        size: 2,
      }).upcoming.map((p) => p.id);
    expect(ids(-1.5)).toEqual(["d1", "d2"]);
    expect(ids(0.8)).toEqual(["d3", "d4"]);
  });

  it("doesn't hold a stretch back for a due task outside the pool", () => {
    const queue = planQueue({
      pool: [candidate("hard", 3)],
      learning: learningAt(abilityAt(1), [], {
        hard: history({ difficulty: 3 }),
        unreleased: history({ difficulty: 1 }),
      }),
      touched: new Map([["hard", touch("wrong", 1)]]),
      now,
    });
    expect(ids(queue.upcoming)).toEqual(["hard"]);
  });

  it("splits touched tasks into earlier and today", () => {
    const touched = new Map([
      ["a", touch("solved", 1)],
      ["b", touch("wrong", 5, true)],
      ["c", touch("solved", 3, true)],
    ]);
    const queue = planQueue({ pool, learning, touched, now, current: "c" });
    expect(queue.earlier).toEqual(["a"]);
    expect(queue.today).toEqual(["c", "b"]);
  });

  it("keeps tasks seen today in the list without offering them again", () => {
    const touched = new Map([
      ["a", touch(undefined, 1, true)],
      ["e", touch(undefined, 2, true)],
    ]);
    const queue = planQueue({
      pool,
      learning,
      touched,
      now,
      current: "b",
      size: 2,
    });
    expect(queue.today).toEqual(["a", "e", "b"]);
    expect(queue.upcoming.map((p) => p.id)).toEqual(["c", "d"]);
  });

  it("comes back to the task seen longest ago once all were seen", () => {
    const touched = new Map(
      pool.map((t, i) => [t.taskId, touch(undefined, i + 1)]),
    );
    const queue = planQueue({
      pool,
      learning,
      touched,
      now,
      current: "h",
      size: 1,
    });
    expect(queue.upcoming[0]).toEqual({
      id: "a",
      repeat: false,
      reason: "seen",
    });
  });
});
