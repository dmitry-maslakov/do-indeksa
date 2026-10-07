import { describe, expect, it } from "vitest";
import {
  answeredCount,
  blankSegments,
  minutesLeft,
  nextIndex,
  runSegments,
} from "./run";

const run = { current: 1, answers: [["2", ""], [""], ["", ""], ["x"]] };

describe("run progress", () => {
  it("counts tasks with any answered part", () => {
    expect(answeredCount(run)).toBe(2);
  });

  it("marks the current task over its answer state", () => {
    expect(runSegments(run)).toEqual(["done", "current", "none", "done"]);
  });

  it("builds a blank strip", () => {
    expect(blankSegments(3)).toEqual(["none", "none", "none"]);
  });
});

describe("continue hints", () => {
  it("prefers the current task, then the first unanswered one", () => {
    expect(nextIndex(run)).toBe(1);
    expect(nextIndex({ ...run, current: 0 })).toBe(1);
    expect(nextIndex({ current: 0, answers: [["1"]] })).toBeUndefined();
  });

  it("counts minutes left only for timed runs", () => {
    const at = { startedAt: 0, minutes: 240, timed: true };
    expect(minutesLeft(at, 60 * 60_000)).toBe(180);
    expect(minutesLeft(at, 300 * 60_000)).toBe(0);
    expect(minutesLeft({ ...at, timed: false }, 0)).toBeUndefined();
  });
});
