import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { learningOf } from "./learning/planner/learning.fixture";
import { reasonOf, suggest } from "./topic-progress";

const fresh = learningOf({ a: {}, b: {} });

describe("reasonOf", () => {
  it("maps each topic signal to a reason", () => {
    const started = learningOf({ a: { state: "warming" } });
    expect(
      (
        [
          "stuck",
          "review",
          "finishTopic",
          "keepGoing",
          "switchTopic",
          "startNext",
          "keepInShape",
        ] as const
      ).map((signal) => reasonOf(signal, "a", started)),
    ).toEqual([
      "stuck",
      "review",
      "almost",
      "started",
      "started",
      "next",
      "review",
    ]);
  });

  it("starts a student without activity at the first topic", () => {
    expect(reasonOf("startNext", "a", fresh)).toBe("first");
  });

  it("shows the reason of the topic it switches to, not the switch", () => {
    const topics = learningOf({
      a: { state: "warming", almost: true },
      b: {},
      c: { state: "inProgress" },
    });
    expect(reasonOf("switchTopic", "a", topics)).toBe("almost");
    expect(reasonOf("switchTopic", "b", topics)).toBe("next");
    expect(reasonOf("switchTopic", "c", topics)).toBe("started");
  });
});

describe("suggest", () => {
  it("starts with the first topic on a first visit", () => {
    expect(suggest(fresh)).toEqual({ topic: "a", reason: "first" });
  });

  it("returns to a topic after four fails in a row, not three", () => {
    const withStreak = (failStreak: number) =>
      suggest(
        learningOf({
          a: { state: "inProgress", lastAt: 1 },
          b: { state: "warming", lastAt: 2, failStreak },
        }),
      );
    expect(withStreak(3)).toEqual({ topic: "b", reason: "started" });
    expect(withStreak(4)).toEqual({ topic: "b", reason: "stuck" });
  });

  it("keeps going in the last topic until six tasks today", () => {
    const withToday = (tasksToday: number) =>
      suggest(
        learningOf({
          a: { state: "inProgress", lastAt: 1 },
          b: { state: "warming", lastAt: 2, tasksToday },
          c: { state: "mastered", lastAt: 0 },
        }),
      );
    expect(withToday(5)).toEqual({ topic: "b", reason: "started" });
    expect(withToday(6)).toEqual({ topic: "a", reason: "started" });
  });

  it("brings back a topic in review", () => {
    expect(
      suggest(
        learningOf({
          a: { state: "warming", lastAt: 2 },
          b: { state: "review", lastAt: 1 },
        }),
      ),
    ).toEqual({ topic: "b", reason: "review" });
  });

  it("starts the next topic only while fewer than three are open", () => {
    const open = {
      a: { state: "mastered" as const, lastAt: 2 },
      b: { state: "warming" as const, lastAt: 1 },
      c: { state: "inProgress" as const, lastAt: 1 },
      d: {},
    };
    expect(suggest(learningOf(open))).toEqual({ topic: "d", reason: "next" });
    expect(
      suggest(
        learningOf({
          ...open,
          a: { state: "warming", lastAt: 2, tasksToday: 6 },
        }),
      ),
    ).toEqual({ topic: "b", reason: "started" });
  });

  it("keeps a mastered topic in shape after a week", () => {
    expect(
      suggest(
        learningOf({
          a: { state: "mastered", lastAt: 2 },
          b: { state: "mastered", lastAt: 1, idleMs: 7 * dayMs },
        }),
      ),
    ).toEqual({ topic: "b", reason: "review" });
  });

  it("falls back to an open topic when no signal fires", () => {
    expect(
      suggest(
        learningOf({
          a: { state: "mastered", lastAt: 3 },
          b: { state: "warming", lastAt: 1 },
          c: { state: "inProgress", lastAt: 1 },
          d: { state: "warming", lastAt: 1 },
          e: {},
        }),
      ),
    ).toEqual({ topic: "b", reason: "started" });
  });

  it("falls back to the first topic once every topic is mastered", () => {
    expect(
      suggest(
        learningOf({
          a: { state: "mastered", lastAt: 1 },
          b: { state: "mastered", lastAt: 2 },
        }),
      ),
    ).toEqual({ topic: "a", reason: "done" });
  });

  it("suggests nothing without topics", () => {
    expect(suggest(new Map())).toBeUndefined();
  });

  it("switches only to an open topic, not a fourth new one", () => {
    expect(
      suggest(
        learningOf({
          a: {},
          b: { state: "inProgress", lastAt: 1 },
          c: { state: "inProgress", lastAt: 3, tasksToday: 6 },
          d: { state: "inProgress", lastAt: 2 },
        }),
      ),
    ).toEqual({ topic: "b", reason: "started" });
  });

  it("moves off an almost topic after six tasks today", () => {
    expect(
      suggest(
        learningOf({
          a: { state: "inProgress", lastAt: 1 },
          b: { state: "inProgress", lastAt: 3, tasksToday: 6, almost: true },
        }),
      ),
    ).toEqual({ topic: "a", reason: "started" });
  });
});
