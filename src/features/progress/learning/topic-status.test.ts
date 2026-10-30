import { describe, expect, it } from "vitest";
import { dayMs, hourMs } from "@/lib/dates";
import type { Difficulty } from "./constants";
import type { Observation, ObservationResult } from "./observations";
import { topicStatus } from "./topic-status";

const start = Date.parse("2026-10-01T09:00:00Z");

const credits: Record<ObservationResult, number> = {
  clean: 1,
  helped: 0.4,
  fail: 0,
};

function obs(
  day: number,
  result: ObservationResult,
  difficulty: Difficulty = 3,
  hour = 0,
): Observation {
  const at = start + day * dayMs + hour * hourMs;
  return {
    taskId: `t${day}-${hour}`,
    topic: "logarithms",
    at,
    day: new Date(at).toISOString().slice(0, 10),
    difficulty,
    result,
    credit: credits[result],
  };
}

const perDay = 3;

const spread = (results: ObservationResult[], difficulty: Difficulty = 3) =>
  results.map((r, i) => obs(Math.floor(i / perDay), r, difficulty, i % perDay));

const lastAtOf = (observations: Observation[]) =>
  observations.at(-1)?.at ?? start;

const statusAfter = (observations: Observation[], ms = hourMs) =>
  topicStatus(
    observations,
    lastAtOf(observations),
    lastAtOf(observations) + ms,
  );

describe("topicStatus", () => {
  it("has no status without activity", () => {
    expect(topicStatus([], null, start)).toEqual({
      state: "notStarted",
      fill: 0,
      almost: false,
      lastAt: null,
    });
  });

  it("is warming once the student has answered, before any observation", () => {
    expect(topicStatus([], start, start)).toMatchObject({
      state: "warming",
      fill: 0,
    });
  });

  it("is warming under eight observations", () => {
    expect(statusAfter(spread(Array(4).fill("clean"))).state).toBe("warming");
  });

  it("masters ten clean d3 tasks over several days", () => {
    expect(statusAfter(spread(Array(10).fill("clean"))).state).toBe("mastered");
  });

  it("doesn't master ten tasks done in one sitting, but calls it almost", () => {
    const sitting = Array.from({ length: 10 }, (_, i) =>
      obs(0, "clean", 3, i / 6),
    );
    expect(statusAfter(sitting)).toMatchObject({
      state: "inProgress",
      almost: true,
    });
  });

  it("needs three clean results at d3 or above", () => {
    expect(statusAfter(spread(Array(10).fill("clean"), 2))).toMatchObject({
      state: "inProgress",
      almost: false,
    });
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
    expect(statusAfter(spread(Array(10).fill("clean")), 14 * dayMs).state).toBe(
      "review",
    );
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
    expect(statusAfter(halves).state).toBe(statusAfter(alternating).state);
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
