import { describe, expect, it } from "vitest";
import {
  abilityAt,
  candidate,
  history,
  learningAt as learningFor,
} from "@/features/progress/learning/planner/learning.fixture";
import type { Learning, TaskHistory } from "@/features/progress/learning/state";
import { start as now } from "@/features/progress/learning/status/observations.fixture";
import type { Answered, Touch } from "@/features/progress/status";
import { dayMs, minuteMs } from "@/lib/dates";
import { planQueue } from "./picks";

const pool = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) =>
  candidate(id, 2, id === "e"),
);

const learning = learningFor(-1);

const days = (n: number) => (n * dayMs) / minuteMs;

const at = (minutes: number) => now + minutes * minuteMs;

const touch = (
  taskId: string,
  minutes: number,
  kind: Touch["kind"] = "first",
): Touch => ({ taskId, kind, from: at(minutes), to: at(minutes) });

const statuses = (found: Record<string, Answered>) =>
  new Map(Object.entries(found));

const constant = (state: Learning) => () => state;

const repeats = (tasks: Record<string, TaskHistory>) =>
  constant(learningFor(-1, [], tasks));

const ids = (picks: { id: string }[]) => picks.map((p) => p.id);

const input = { pool, learningAt: constant(learning), now };

describe("planQueue", () => {
  it("mixes due repeats into new tasks, at most two in every six", () => {
    const queue = planQueue({
      ...input,
      learningAt: repeats({
        a: history({ dueAt: now - 2 * dayMs }),
        b: history({ lastResult: "clean", dueAt: now - dayMs }),
        c: history({ lastResult: "helped", dueAt: now + dayMs }),
        d: history({ lastResult: "partlyRight", dueAt: now - dayMs }),
      }),
      touches: ["a", "b", "c", "d"].map((id, i) => touch(id, -days(10 - i))),
      statuses: statuses({
        a: "wrong",
        b: "solved",
        c: "solved",
        d: "wrong",
      }),
      size: 7,
    });
    expect(queue.visit).toEqual([]);
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

  it("adds the next due repeat at the bottom when a row is taken", () => {
    const due = history({ dueAt: now - dayMs });
    const base = {
      ...input,
      learningAt: repeats({ a: due, b: due, c: due, d: due }),
      statuses: statuses({ a: "wrong", b: "wrong", c: "wrong", d: "wrong" }),
    };
    const old = ["a", "b", "c", "d"].map((id, i) => touch(id, -days(9) + i));
    const before = planQueue({ ...base, touches: old });
    const after = planQueue({
      ...base,
      touches: [...old, touch("a", -20)],
      current: "a",
    });
    expect(before.upcoming.map((p) => p.repeat)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(ids(before.upcoming)).toEqual(["a", "b", "e", "f", "g", "h"]);
    expect(after.visit).toEqual(["a"]);
    expect(after.repeated).toEqual(["a"]);
    expect(ids(after.upcoming)).toEqual(["b", "e", "f", "g", "h", "c"]);
  });

  it("doesn't bring a mistake back before it is due", () => {
    const queue = planQueue({
      ...input,
      learningAt: repeats({ a: history({ dueAt: now + 1 }) }),
      touches: [touch("a", -days(1))],
      statuses: statuses({ a: "wrong" }),
      size: 8,
    });
    expect(ids(queue.upcoming)).not.toContain("a");
    expect(queue.upcoming).toHaveLength(7);
  });

  it("brings a task studied without an answer back on its schedule", () => {
    const queue = planQueue({
      ...input,
      learningAt: repeats({
        a: history({ dueAt: now - dayMs }),
        b: history({ dueAt: now + dayMs }),
      }),
      touches: pool.map((t, i) => touch(t.taskId, -days(10 - i))),
      statuses: new Map(),
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
        learningAt: constant(learningFor(ability)),
        touches: [],
        statuses: new Map(),
        now,
        size: 2,
      }).upcoming.map((p) => p.id);
    expect(ids(-1.5)).toEqual(["d1", "d2"]);
    expect(ids(0.8)).toEqual(["d3", "d4"]);
  });

  it("doesn't hold a stretch back for a due task outside the pool", () => {
    const queue = planQueue({
      pool: [candidate("hard", 3)],
      learningAt: constant(
        learningFor(abilityAt(1), [], {
          hard: history({ difficulty: 3 }),
          unreleased: history({ difficulty: 1 }),
        }),
      ),
      touches: [touch("hard", -days(1))],
      statuses: statuses({ hard: "wrong" }),
      now,
    });
    expect(ids(queue.upcoming)).toEqual(["hard"]);
  });

  it("keeps tasks seen in the visit out of the offer", () => {
    const queue = planQueue({
      ...input,
      touches: [touch("a", -30), touch("e", -20)],
      statuses: new Map(),
      current: "b",
      size: 2,
    });
    expect(queue.visit).toEqual(["a", "e", "b"]);
    expect(ids(queue.upcoming)).toEqual(["c", "d"]);
  });

  it("comes back to the task seen longest ago once all were seen", () => {
    const queue = planQueue({
      ...input,
      touches: pool.map((t, i) => touch(t.taskId, -days(10 - i))),
      statuses: new Map(),
      current: "h",
      size: 1,
    });
    expect(queue.upcoming[0]).toEqual({
      id: "a",
      repeat: false,
      reason: "seen",
    });
  });

  it("picks the same first row whatever the size without a visit", () => {
    const touches = [touch("a", -days(2)), touch("b", -days(3))];
    const one = planQueue({ ...input, touches, statuses: new Map(), size: 1 });
    const six = planQueue({ ...input, touches, statuses: new Map() });
    expect(one.upcoming).toEqual(six.upcoming.slice(0, 1));
  });

  describe("the visit", () => {
    it("lists the tasks by their first touch and ends with the current one", () => {
      const queue = planQueue({
        ...input,
        touches: [
          touch("a", -days(2)),
          touch("c", -50),
          touch("b", -40),
          touch("c", -30),
          touch("f", -20, "mock"),
        ],
        statuses: statuses({ a: "solved", b: "wrong" }),
        current: "d",
      });
      expect(queue.visit).toEqual(["c", "b", "d"]);
    });

    it("keeps the place of a task opened again", () => {
      const touches = [touch("a", -50), touch("b", -40), touch("c", -30)];
      const again = [...touches, touch("a", -10)];
      const once = planQueue({
        ...input,
        touches,
        statuses: new Map(),
        current: "c",
      });
      const twice = planQueue({
        ...input,
        touches: again,
        statuses: new Map(),
        current: "a",
      });
      expect(once.visit).toEqual(["a", "b", "c"]);
      expect(twice.visit).toEqual(["a", "b", "c"]);
      expect(twice.upcoming).toEqual(once.upcoming);
    });

    it("leaves a visit that ended an hour ago, keeping the current task", () => {
      const queue = planQueue({
        ...input,
        touches: [touch("a", -200), touch("b", -190)],
        statuses: statuses({ a: "solved", b: "solved" }),
        current: "c",
      });
      expect(queue.visit).toEqual(["c"]);
    });

    it("has nothing before the first touch", () => {
      const queue = planQueue({ ...input, touches: [], statuses: new Map() });
      expect(queue.visit).toEqual([]);
      expect(queue.upcoming).toHaveLength(6);
    });

    it("doesn't count tasks of a test", () => {
      const queue = planQueue({
        ...input,
        touches: [touch("a", -30), touch("b", -20, "mock")],
        statuses: new Map(),
        current: "c",
      });
      expect(queue.visit).toEqual(["a", "c"]);
      expect(ids(queue.upcoming)).not.toContain("b");
    });

    it("places a task by its first touch outside a test", () => {
      const queue = planQueue({
        ...input,
        touches: [
          touch("a", -50),
          touch("z", -40, "mock"),
          touch("b", -30),
          touch("z", -20),
        ],
        statuses: new Map(),
        current: "c",
      });
      expect(queue.visit).toEqual(["a", "b", "z", "c"]);
    });

    it("tells whether the current task is new to the visit", () => {
      const touches = [touch("a", -30), touch("b", -20)];
      const plan = (current: string) =>
        planQueue({ ...input, touches, statuses: new Map(), current });
      expect(plan("b").returning).toBe(false);
      expect(plan("c").returning).toBe(true);
      expect(
        planQueue({ ...input, touches, statuses: new Map() }).returning,
      ).toBe(false);
    });

    it("lists an open task outside the topic and offers the whole pool", () => {
      const queue = planQueue({
        ...input,
        touches: [touch("a", -10)],
        statuses: new Map(),
        current: "elsewhere",
      });
      expect(queue.visit).toEqual(["a", "elsewhere"]);
      expect(ids(queue.upcoming)).not.toContain("a");
      expect(queue.upcoming).toHaveLength(6);
    });

    it("offers nothing from an empty pool", () => {
      const queue = planQueue({
        ...input,
        pool: [],
        touches: [touch("a", -10)],
        statuses: new Map(),
        current: "a",
      });
      expect(queue).toEqual({
        visit: ["a"],
        upcoming: [],
        returning: false,
        repeated: [],
        begun: at(-10),
      });
    });

    it("starts the topic where the rail starts while the visit lasts", () => {
      const touches = [touch("a", -30), touch("b", -20)];
      const start = planQueue({ ...input, touches, statuses: new Map() });
      const rail = planQueue({
        ...input,
        touches,
        statuses: new Map(),
        current: "b",
      });
      expect(start.upcoming).toEqual(rail.upcoming);
      expect(start.visit).toEqual(["a", "b"]);
    });

    it("builds the state once for each task opened, not for each session", () => {
      const moments: number[] = [];
      const touches = [
        touch("x", -days(5)),
        touch("y", -days(5) + 1),
        ...["a", "b", "a", "b", "a", "b"].map((id, i) => touch(id, -40 + i)),
      ];
      planQueue({
        ...input,
        pool: [...pool.slice(0, 2), candidate("x", 2), candidate("y", 2)],
        learningAt: (moment) => {
          moments.push(moment);
          return learning;
        },
        touches,
        statuses: statuses({ x: "solved", y: "solved" }),
        current: "b",
      });
      expect(moments).toHaveLength(3);
    });

    it("builds no state once every task of the pool is taken", () => {
      const moments: number[] = [];
      planQueue({
        ...input,
        pool: pool.slice(0, 3),
        learningAt: (moment) => {
          moments.push(moment);
          return learning;
        },
        touches: ["a", "b", "c"].map((id, i) => touch(id, -30 + i)),
        statuses: new Map(),
        current: "c",
      });
      expect(moments).toHaveLength(1);
    });

    it("never offers a task of the visit, even when it is due again", () => {
      const queue = planQueue({
        ...input,
        learningAt: repeats({ a: history({ dueAt: now - dayMs }) }),
        touches: [touch("a", -30)],
        statuses: statuses({ a: "wrong" }),
        current: "b",
      });
      expect(queue.visit).toEqual(["a", "b"]);
      expect(ids(queue.upcoming)).not.toContain("a");
    });
  });

  describe("rows already shown", () => {
    const rows = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"];
    const stretch = ["s1", "s2", "s3", "s4", "s5", "s6"];
    const wide = [
      candidate("now", 2),
      ...rows.map((id) => candidate(id, 1)),
      ...stretch.map((id) => candidate(id, 4)),
    ];
    const answered = now - 5 * minuteMs;
    const timeline = (moment: number) =>
      moment <= answered ? learningFor(-1.5) : learningFor(0.9);
    const base = {
      pool: wide,
      learningAt: timeline,
      now,
      statuses: new Map(),
    };

    it("stay when the current task is answered", () => {
      const touches = [touch("now", -10)];
      const shown = planQueue({
        ...base,
        now: answered,
        touches,
        current: "now",
      });
      const after = planQueue({ ...base, touches, current: "now" });
      const fresh = planQueue({
        ...base,
        touches: [],
        learningAt: constant(learningFor(0.9)),
        current: "now",
      });
      expect(after.upcoming).toEqual(shown.upcoming);
      expect(ids(fresh.upcoming)).not.toEqual(ids(shown.upcoming));
    });

    it("only shift up and get one new row at the bottom after a click on the third", () => {
      const first = planQueue({
        ...base,
        now: answered,
        touches: [touch("now", -10)],
        current: "now",
      });
      const [one, two, three, ...rest] = ids(first.upcoming);
      const second = planQueue({
        ...base,
        touches: [touch("now", -10), touch(three ?? "", -3)],
        current: three,
      });
      expect(second.visit).toEqual(["now", three]);
      expect(ids(second.upcoming).slice(0, 5)).toEqual([one, two, ...rest]);
      expect(second.upcoming).toHaveLength(6);
      expect(ids(second.upcoming)).not.toContain(three);
    });
  });
});
