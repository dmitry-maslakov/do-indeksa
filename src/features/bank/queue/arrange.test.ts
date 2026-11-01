import { describe, expect, it } from "vitest";
import { arrange } from "./arrange";
import type { QueueRow } from "./queue";

const row = (id: string, rest: Partial<QueueRow> = {}): QueueRow => ({
  id,
  html: id,
  label: id,
  topic: "t",
  year: null,
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
