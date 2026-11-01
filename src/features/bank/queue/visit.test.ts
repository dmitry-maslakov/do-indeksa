import { describe, expect, it } from "vitest";
import type { Touch } from "@/features/progress/status";
import { minuteMs } from "@/lib/dates";
import { earlierRuns, visitOf } from "./visit";

const now = Date.parse("2026-10-20T22:20:00Z");

const touch = (
  taskId: string,
  minutesAgo: number,
  lasted = 0,
  kind: Touch["kind"] = "first",
): Touch => ({
  taskId,
  kind,
  from: now - minutesAgo * minuteMs,
  to: now - (minutesAgo - lasted) * minuteMs,
});

const ids = (touches: Touch[], at = now) =>
  visitOf(touches, at).map((t) => t.taskId);

describe("visitOf", () => {
  it("runs back from the last touch over gaps shorter than four hours", () => {
    const touches = [
      touch("old", 900),
      touch("a", 600),
      touch("b", 400),
      touch("c", 200),
    ];
    expect(ids(touches)).toEqual(["a", "b", "c"]);
  });

  it("starts a new visit at a gap of four full hours", () => {
    expect(ids([touch("a", 260), touch("b", 20)])).toEqual(["b"]);
    expect(ids([touch("a", 259), touch("b", 20)])).toEqual(["a", "b"]);
  });

  it("is over once the last touch is four hours old", () => {
    expect(ids([touch("a", 500), touch("b", 240)])).toEqual([]);
    expect(ids([touch("a", 500), touch("b", 239)])).toEqual(["b"]);
  });

  it("counts the time spent on a task", () => {
    expect(ids([touch("a", 310), touch("b", 30)])).toEqual(["b"]);
    expect(ids([touch("a", 310, 70), touch("b", 30)])).toEqual(["a", "b"]);
    expect(ids([touch("a", 310, 70)])).toEqual([]);
    expect(ids([touch("a", 310, 90)])).toEqual(["a"]);
  });

  it("doesn't depend on the calendar day", () => {
    expect(ids([touch("a", 40), touch("b", 10)])).toEqual(["a", "b"]);
  });

  it("ignores touches in test sessions", () => {
    const touches = [
      touch("a", 30),
      touch("test", 20, 0, "mock"),
      touch("b", 10),
    ];
    expect(ids(touches)).toEqual(["a", "b"]);
    expect(ids([touch("test", 5, 0, "mock")])).toEqual([]);
    expect(ids([])).toEqual([]);
  });

  it("keeps every touch of a task opened again", () => {
    const touches = [touch("a", 50), touch("b", 40), touch("a", 10)];
    expect(ids(touches)).toEqual(["a", "b", "a"]);
  });
});

describe("earlierRuns", () => {
  const runs = (touches: Touch[]) =>
    earlierRuns(touches, now).map((run) => run.map((t) => t.taskId));

  it("lists the sessions before the visit", () => {
    const touches = [
      touch("a", 900),
      touch("b", 880),
      touch("c", 500),
      touch("d", 20),
    ];
    expect(runs(touches)).toEqual([["a", "b"], ["c"]]);
  });

  it("lists every session once the visit is over", () => {
    expect(runs([touch("a", 900), touch("b", 300)])).toEqual([["a"], ["b"]]);
    expect(runs([])).toEqual([]);
  });
});
