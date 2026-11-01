import { describe, expect, it } from "vitest";
import { arrange, listed, progressOf } from "./arrange";
import type { QueueRow } from "./queue";

const row = (id: string, rest: Partial<QueueRow> = {}): QueueRow => ({
  id,
  html: id,
  label: id,
  year: null,
  level: "easy",
  ...rest,
});

const rows = (...ids: string[]) => ids.map((id) => row(id));

const ids = (list: QueueRow[]) => list.map((r) => r.id);

describe("arrange", () => {
  const queue = {
    visit: rows("v1", "v2"),
    upcoming: [
      row("u1", { repeat: true, reason: "repeatDue" }),
      ...rows("u2", "u3"),
    ],
  };

  it("leaves a queue that already has the task in the visit", () => {
    expect(arrange(queue, "v1")).toBe(queue);
  });

  it("leaves a queue that does not know the task", () => {
    expect(arrange(queue, "x")).toBe(queue);
  });

  it("moves the first upcoming task to the end of the visit", () => {
    const next = arrange(queue, "u1");
    expect(ids(next.visit)).toEqual(["v1", "v2", "u1"]);
    expect(ids(next.upcoming)).toEqual(["u2", "u3"]);
  });

  it("moves any upcoming task, keeping the order of the rest", () => {
    const next = arrange(queue, "u3");
    expect(ids(next.visit)).toEqual(["v1", "v2", "u3"]);
    expect(ids(next.upcoming)).toEqual(["u1", "u2"]);
  });

  it("drops the repeat mark and the pick reason of the moved task", () => {
    const [moved] = arrange(queue, "u1").visit.slice(-1);
    expect(moved).toEqual(row("u1"));
  });
});

describe("listed", () => {
  const queue = {
    visit: rows("v1"),
    upcoming: rows("u1"),
  };

  it("finds a task in any section", () => {
    expect(["v1", "u1"].map((id) => listed(queue, id))).toEqual([true, true]);
  });

  it("does not find a task the queue does not have", () => {
    expect(listed(queue, "x")).toBe(false);
  });
});

describe("progressOf", () => {
  const visit = [
    row("a", { status: "solved" }),
    row("b", { status: "wrong" }),
    row("c", { status: "revealed" }),
    row("d", { status: "solved" }),
    row("e"),
  ];

  it("counts the tasks before the current one and the right ones among them", () => {
    expect(progressOf({ visit, upcoming: [] }, "e")).toEqual({
      position: 5,
      done: 4,
      right: 2,
    });
  });

  it("counts only what precedes a task in the middle of the visit", () => {
    expect(progressOf({ visit, upcoming: [] }, "b")).toEqual({
      position: 2,
      done: 1,
      right: 1,
    });
  });

  it("has nothing before the first task", () => {
    expect(progressOf({ visit, upcoming: [] }, "a")).toEqual({
      position: 1,
      done: 0,
      right: 0,
    });
  });

  it("does not know a task outside the visit", () => {
    expect(progressOf({ visit, upcoming: rows("u") }, "u")).toBeUndefined();
  });
});
