import { describe, expect, it } from "vitest";
import { minuteMs } from "@/lib/dates";
import { answeredCount, nextIndex, overtimeAt } from "./state";

const run = { current: 1, answers: [["2", ""], [""], ["", ""], ["x"]] };

describe("run progress", () => {
  it("counts tasks with any answered part", () => {
    expect(answeredCount(run)).toBe(2);
  });
});

describe("continue hints", () => {
  it("prefers the current task, then the first unanswered one", () => {
    expect(nextIndex(run)).toBe(1);
    expect(nextIndex({ ...run, current: 0 })).toBe(1);
    expect(nextIndex({ current: 0, answers: [["1"]] })).toBeUndefined();
  });

  it("tells a timed run finished after the limit from one in time", () => {
    const at = { startedAt: 0, minutes: 240, timed: true };
    expect(overtimeAt(at, 240 * minuteMs)).toBe(false);
    expect(overtimeAt(at, 240 * minuteMs + 1)).toBe(true);
    expect(overtimeAt({ ...at, timed: false }, 300 * minuteMs)).toBeNull();
  });
});
