import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { defaultPolicy } from "../policy";
import type { Difficulty, Observation, ObservationResult } from "../types";
import { masteredConditions, unmetConditions } from "./conditions";
import { obs } from "./observations.fixture";

const daily = (results: ObservationResult[], difficulty: Difficulty = 3) =>
  results.map((r, i) => obs(r, { difficulty, hours: i * 24 }));

const holds = (
  name: keyof typeof masteredConditions,
  window: Observation[],
  typeCount = 1,
) => masteredConditions[name](window, defaultPolicy, typeCount);

const ofTypes = (result: ObservationResult, types: string[]) =>
  types.map((type, i) => obs(result, { hours: i, type }));

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

  it("needs clean results in three types", () => {
    const covered = (window: Observation[]) => holds("typesCovered", window, 5);
    expect(covered(ofTypes("clean", ["a", "b"]))).toBe(false);
    expect(covered(ofTypes("clean", ["a", "a", "b"]))).toBe(false);
    expect(covered(ofTypes("clean", ["a", "b", "c"]))).toBe(true);
  });

  it("doesn't count a helped result toward a type", () => {
    const window = [
      ...ofTypes("clean", ["a", "b"]),
      ...ofTypes("helped", ["c"]),
      ...ofTypes("fail", ["d"]),
    ];
    expect(holds("typesCovered", window, 5)).toBe(false);
  });

  it("needs only the types the topic serves when it has fewer than three", () => {
    const one = ofTypes("clean", ["a"]);
    expect(holds("typesCovered", one, 2)).toBe(false);
    expect(holds("typesCovered", one, 1)).toBe(true);
    expect(holds("typesCovered", ofTypes("clean", ["a", "b"]), 2)).toBe(true);
  });

  it("holds for a topic without servable types", () => {
    expect(holds("typesCovered", [], 0)).toBe(true);
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
    expect(unmetConditions([], 1, defaultPolicy)).toEqual([
      "fullWindow",
      "solvesAtTarget",
      "cleanHardEnough",
      "typesCovered",
      "spreadOverDays",
      "spansHours",
    ]);
    expect(
      unmetConditions(daily(Array(10).fill("clean")), 1, defaultPolicy),
    ).toEqual([]);
  });

  it("reads its thresholds from the policy", () => {
    const window = daily(Array(2).fill("clean"));
    expect(
      unmetConditions(window, 3, {
        ...defaultPolicy,
        windowSize: 2,
        cleanHardNeeded: 2,
        laterDaysNeeded: 1,
        spanNeededMs: dayMs,
        typesNeeded: 1,
      }),
    ).toEqual([]);
  });
});
