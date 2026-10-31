import { describe, expect, it } from "vitest";
import { dayMs, hourMs } from "@/lib/dates";
import { defaultPolicy } from "../policy";
import type { Difficulty, Observation, ObservationResult } from "../types";
import { obs, start } from "./observations.fixture";
import { topicStatus } from "./topic-status";

const perDay = 3;

const spread = (results: ObservationResult[], difficulty: Difficulty = 3) =>
  results.map((r, i) =>
    obs(r, { difficulty, hours: Math.floor(i / perDay) * 24 + (i % perDay) }),
  );

const lastAtOf = (observations: Observation[]) =>
  observations.at(-1)?.at ?? start;

const statusAfter = (observations: Observation[], typeCount = 1, ms = hourMs) =>
  topicStatus(
    observations,
    typeCount,
    lastAtOf(observations),
    lastAtOf(observations) + ms,
  );

const typed = (observations: Observation[], types: string[]) =>
  observations.map((o, i) => ({ ...o, type: types[i % types.length] ?? "" }));

describe("topicStatus", () => {
  it("has no status without activity", () => {
    expect(topicStatus([], 1, null, start)).toMatchObject({
      state: "notStarted",
      fill: 0,
      almost: false,
      lastAt: null,
    });
  });

  it("is warming once the student has answered, before any observation", () => {
    expect(topicStatus([], 1, start, start)).toMatchObject({
      state: "warming",
      fill: 0,
    });
  });

  it("is warming under eight observations", () => {
    expect(statusAfter(spread(Array(4).fill("clean"))).state).toBe("warming");
  });

  it("masters ten clean d3 tasks over several days", () => {
    expect(statusAfter(spread(Array(10).fill("clean")))).toMatchObject({
      state: "mastered",
      almost: false,
      missing: [],
    });
  });

  it("is in progress from eight observations", () => {
    expect(statusAfter(spread(Array(8).fill("fail")))).toMatchObject({
      state: "inProgress",
      missing: [
        "fullWindow",
        "solvesAtTarget",
        "cleanHardEnough",
        "typesCovered",
      ],
    });
  });

  it("orders observations by time before taking the window", () => {
    const observations = spread(Array(10).fill("clean"));
    expect(statusAfter(observations.toReversed()).state).toBe(
      statusAfter(observations).state,
    );
  });

  it("reads its numbers from the policy", () => {
    const observations = spread(Array(4).fill("clean"));
    const lastAt = lastAtOf(observations);
    expect(
      topicStatus(observations, 1, lastAt, lastAt, {
        ...defaultPolicy,
        warmingBelow: 3,
      }).state,
    ).toBe("inProgress");
  });

  it("doesn't master ten tasks done in one sitting, but calls it almost", () => {
    const sitting = Array.from({ length: 10 }, (_, i) =>
      obs("clean", { hours: i / 6 }),
    );
    expect(statusAfter(sitting)).toMatchObject({
      state: "inProgress",
      almost: true,
      missing: ["spreadOverDays", "spansHours"],
    });
  });

  it("needs three clean results at d3 or above", () => {
    expect(statusAfter(spread(Array(10).fill("clean"), 2))).toMatchObject({
      state: "inProgress",
      almost: false,
      missing: ["cleanHardEnough"],
    });
  });

  it("needs clean results in three types when the topic serves them", () => {
    const tenClean = spread(Array(10).fill("clean"));
    expect(statusAfter(tenClean, 4)).toMatchObject({
      state: "inProgress",
      almost: false,
      missing: ["typesCovered"],
    });
    expect(statusAfter(typed(tenClean, ["a", "b", "c"]), 4)).toMatchObject({
      state: "mastered",
      missing: [],
    });
  });

  it("needs only the types the topic serves when it has fewer than three", () => {
    const tenClean = spread(Array(10).fill("clean"));
    expect(statusAfter(typed(tenClean, ["a", "b"]), 2).state).toBe("mastered");
    expect(statusAfter(tenClean, 0).state).toBe("mastered");
  });

  it("doesn't call it almost while a type lacks a clean result", () => {
    const sitting = Array.from({ length: 10 }, (_, i) =>
      obs("clean", { hours: i / 6 }),
    );
    expect(statusAfter(sitting, 3)).toMatchObject({
      almost: false,
      missing: ["typesCovered", "spreadOverDays", "spansHours"],
    });
  });

  it("names the types with a clean result in the window", () => {
    const observations = typed(spread(["clean", "helped", "fail", "clean"]), [
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(statusAfter(observations, 4).cleanTypes).toEqual(["a", "d"]);
  });

  it("holds mastered at d4 with a lower target", () => {
    const climb = spread([
      ...Array(10).fill("clean"),
      ...["clean", "clean", "fail", "clean", "clean"],
      ...["fail", "clean", "helped", "clean", "fail"],
    ]).map((o, i) => (i >= 10 ? { ...o, difficulty: 4 as const } : o));
    expect(statusAfter(climb).state).toBe("mastered");
  });

  it("loses mastered only well below the target", () => {
    const base = spread(Array(10).fill("clean"));
    const failsLater = (count: number) =>
      spread(Array(count).fill("fail")).map((o) => ({
        ...o,
        at: o.at + 10 * dayMs,
      }));
    expect(statusAfter([...base, ...failsLater(3)]).state).toBe("mastered");
    expect(statusAfter([...base, ...failsLater(5)]).state).toBe("inProgress");
  });

  it("asks for review two weeks after the last task", () => {
    expect(
      statusAfter(spread(Array(10).fill("clean")), 1, 14 * dayMs).state,
    ).toBe("review");
  });

  it("compares the score with the target without float error", () => {
    const atD4 = (results: ObservationResult[]) =>
      spread(results).map((o) => ({ ...o, difficulty: 4 as const }));
    const halves = atD4([
      ...Array(5).fill("clean"),
      ...Array(5).fill("helped"),
    ]);
    const alternating = atD4(
      Array.from({ length: 10 }, (_, i) => (i % 2 ? "helped" : "clean")),
    );
    expect(statusAfter(halves).state).toBe("mastered");
    expect(statusAfter(alternating).state).toBe("mastered");
  });
});

describe("the bar", () => {
  it("shows the level solved well, a quarter per level", () => {
    for (const difficulty of [1, 2, 3, 4] as const)
      expect(
        statusAfter(spread(Array(10).fill("clean"), difficulty)).fill,
      ).toBeCloseTo(difficulty / 4);
  });

  it("stays empty for fails, however many", () => {
    expect(statusAfter(spread(Array(10).fill("fail"))).fill).toBe(0);
    expect(statusAfter(spread(Array(7).fill("fail"))).fill).toBe(0);
  });

  it("counts solving at the target as solving the level well", () => {
    const nineOfTen = spread([...Array(9).fill("clean"), "fail"]);
    expect(statusAfter(nineOfTen).fill).toBeCloseTo(3 / 4);
  });
});
