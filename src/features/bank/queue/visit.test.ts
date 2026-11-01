import { describe, expect, it } from "vitest";
import type { Touch } from "@/features/progress/status";
import { minuteMs } from "@/lib/dates";
import { visitOf } from "./visit";

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
  it("runs back from the last touch over gaps shorter than an hour", () => {
    const touches = [
      touch("old", 400),
      touch("a", 150),
      touch("b", 100),
      touch("c", 50),
    ];
    expect(ids(touches)).toEqual(["a", "b", "c"]);
  });

  it("starts a new visit at a gap of a full hour", () => {
    expect(ids([touch("a", 80), touch("b", 20)])).toEqual(["b"]);
    expect(ids([touch("a", 79), touch("b", 20)])).toEqual(["a", "b"]);
  });

  it("is over once the last touch is an hour old", () => {
    expect(ids([touch("a", 200), touch("b", 60)])).toEqual([]);
    expect(ids([touch("a", 200), touch("b", 59)])).toEqual(["b"]);
  });

  it("counts the time spent on a task", () => {
    expect(ids([touch("a", 130), touch("b", 30)])).toEqual(["b"]);
    expect(ids([touch("a", 130, 70), touch("b", 30)])).toEqual(["a", "b"]);
    expect(ids([touch("a", 130, 60)])).toEqual([]);
    expect(ids([touch("a", 130, 90)])).toEqual(["a"]);
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
