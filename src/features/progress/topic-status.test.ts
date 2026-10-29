import { describe, expect, it } from "vitest";
import { dayMs, hourMs } from "@/lib/dates";
import type { Difficulty } from "./learning";
import type { Observation, ObservationResult } from "./observations";
import { topicStatus as statusAt } from "./topic-status";

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

const topicStatus = (observations: Observation[], now: number) =>
  statusAt(
    observations,
    observations.reduce<number | null>(
      (at, o) => Math.max(at ?? o.at, o.at),
      null,
    ),
    now,
  );

const later = (observations: Observation[], ms = hourMs) =>
  (observations.at(-1)?.at ?? start) + ms;

describe("topicStatus", () => {
  it("has no status without observations", () => {
    expect(topicStatus([], start)).toEqual({
      state: "notStarted",
      share: 0,
      lastAt: null,
    });
  });

  it("is warming under eight observations", () => {
    const few = spread(Array(4).fill("clean"));
    expect(topicStatus(few, later(few))).toMatchObject({
      state: "warming",
      share: 4 / 8,
    });
  });

  it("masters ten clean d3 tasks over several days", () => {
    const ten = spread(Array(10).fill("clean"));
    expect(topicStatus(ten, later(ten))).toMatchObject({
      state: "mastered",
      share: 1,
    });
  });

  it("doesn't master ten tasks done in one sitting", () => {
    const sitting = Array.from({ length: 10 }, (_, i) =>
      obs(0, "clean", 3, i / 6),
    );
    expect(topicStatus(sitting, later(sitting)).state).toBe("inProgress");
  });

  it("needs three clean results at d3 or above", () => {
    const easy = spread(Array(10).fill("clean"), 2);
    expect(topicStatus(easy, later(easy)).state).toBe("inProgress");
  });

  it("holds mastered at d4 with a lower bar", () => {
    const climb = spread([
      ...Array(10).fill("clean"),
      ...[
        "clean",
        "clean",
        "fail",
        "clean",
        "clean",
        "fail",
        "clean",
        "helped",
        "clean",
        "fail",
      ],
    ]).map((o, i) => (i >= 10 ? { ...o, difficulty: 4 as const } : o));
    expect(topicStatus(climb, later(climb)).state).toBe("mastered");
  });

  it("loses mastered only well below the bar", () => {
    const base = spread(Array(10).fill("clean"));
    const slip = [
      ...base,
      ...spread(Array(3).fill("fail")).map((o) => ({
        ...o,
        at: o.at + 10 * dayMs,
      })),
    ];
    expect(topicStatus(slip, later(slip)).state).toBe("mastered");
    const fall = [
      ...base,
      ...spread(Array(5).fill("fail")).map((o) => ({
        ...o,
        at: o.at + 10 * dayMs,
      })),
    ];
    expect(topicStatus(fall, later(fall)).state).toBe("inProgress");
  });

  it("asks for review two weeks after the last task", () => {
    const ten = spread(Array(10).fill("clean"));
    expect(topicStatus(ten, later(ten, 14 * dayMs)).state).toBe("review");
  });

  it("measures progress by how well and how long the student has worked", () => {
    const mixed = spread([
      "clean",
      "fail",
      "clean",
      "fail",
      "clean",
      "fail",
      "clean",
      "fail",
    ]);
    const status = topicStatus(mixed, later(mixed));
    expect(status.state).toBe("inProgress");
    expect(status.share).toBeGreaterThan(0);
    expect(status.share).toBeLessThan(1);
  });
});

describe("topicStatus with activity but no observations yet", () => {
  it("is warming once the student has answered", () => {
    expect(statusAt([], start, start).state).toBe("warming");
  });
});

describe("topicStatus thresholds", () => {
  it("compares the score with the target without float error", () => {
    const halves = spread([
      ...Array(5).fill("clean"),
      ...Array(5).fill("helped"),
    ]).map((o) => ({ ...o, difficulty: 4 as const }));
    const alternating = spread(
      Array.from({ length: 10 }, (_, i) => (i % 2 ? "helped" : "clean")),
    ).map((o) => ({ ...o, difficulty: 4 as const }));
    expect(topicStatus(halves, later(halves)).state).toBe(
      topicStatus(alternating, later(alternating)).state,
    );
  });

  it("doesn't fill the bar for volume alone", () => {
    const fails = spread(Array(10).fill("fail"));
    expect(topicStatus(fails, later(fails)).share).toBe(0);
  });
});
