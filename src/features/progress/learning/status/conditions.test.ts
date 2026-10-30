import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { defaultPolicy } from "../policy";
import type { Difficulty, Observation, ObservationResult } from "../types";
import { masteredConditions, unmetConditions } from "./conditions";
import { obs } from "./observations.fixture";

const daily = (results: ObservationResult[], difficulty: Difficulty = 3) =>
  results.map((r, i) => obs(r, { difficulty, hours: i * 24 }));

const holds = (name: keyof typeof masteredConditions, window: Observation[]) =>
  masteredConditions[name](window, defaultPolicy);

describe("mastered conditions", () => {
  it("needs a full window", () => {
    expect(holds("fullWindow", daily(Array(9).fill("clean")))).toBe(false);
    expect(holds("fullWindow", daily(Array(10).fill("clean")))).toBe(true);
  });

  it("compares the weighted score with the weighted target", () => {
    const mixed = [
      ...daily(Array(3).fill("clean"), 4),
      obs("fail", { difficulty: 1, hours: 100 }),
    ];
    expect(holds("solvesAtTarget", mixed)).toBe(true);
    expect(holds("solvesAtTarget", daily(["clean", "helped"]))).toBe(false);
    expect(holds("solvesAtTarget", [])).toBe(false);
  });

  it("counts only clean results at d3 and above as hard", () => {
    expect(holds("cleanHardEnough", daily(Array(3).fill("clean"), 2))).toBe(
      false,
    );
    expect(
      holds("cleanHardEnough", daily(["clean", "clean", "helped"], 4)),
    ).toBe(false);
    expect(holds("cleanHardEnough", daily(Array(3).fill("clean"), 4))).toBe(
      true,
    );
  });

  it("counts observations on days after the window's first", () => {
    const sameDay = [0, 1, 2, 3].map((hours) => obs("clean", { hours }));
    expect(holds("spreadOverDays", sameDay)).toBe(false);
    expect(holds("spreadOverDays", daily(Array(4).fill("clean")))).toBe(true);
    expect(holds("spreadOverDays", daily(Array(3).fill("clean")))).toBe(false);
  });

  it("needs eighteen hours from the first to the last", () => {
    const span = (hours: number) => [
      obs("clean", { hours: 0 }),
      obs("clean", { hours }),
    ];
    expect(holds("spansHours", span(17))).toBe(false);
    expect(holds("spansHours", span(18))).toBe(true);
    expect(holds("spansHours", [])).toBe(false);
  });

  it("names the conditions not met", () => {
    expect(unmetConditions([], defaultPolicy)).toEqual([
      "fullWindow",
      "solvesAtTarget",
      "cleanHardEnough",
      "spreadOverDays",
      "spansHours",
    ]);
    expect(
      unmetConditions(daily(Array(10).fill("clean")), defaultPolicy),
    ).toEqual([]);
  });

  it("reads its thresholds from the policy", () => {
    const window = daily(Array(2).fill("clean"));
    expect(
      unmetConditions(window, {
        ...defaultPolicy,
        windowSize: 2,
        cleanHardNeeded: 2,
        laterDaysNeeded: 1,
        spanNeededMs: dayMs,
      }),
    ).toEqual([]);
  });
});
