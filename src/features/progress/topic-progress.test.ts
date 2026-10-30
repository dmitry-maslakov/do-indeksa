import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import type { Observation } from "./learning/observations";
import type { TopicState } from "./learning/topic-status";
import { suggest, type TopicProgress, topicProgress } from "./topic-progress";

const now = 100 * dayMs;

const observation = (topic: string, at: number): Observation => ({
  taskId: `${topic}-${at}`,
  topic,
  at,
  day: new Date(at).toISOString().slice(0, 10),
  difficulty: 2,
  result: "fail",
  credit: 0,
});

const topic = (
  name: string,
  state: TopicState,
  lastAt: number | null = null,
  almost = false,
): TopicProgress => ({ topic: name, state, fill: 0, almost, lastAt });

describe("topicProgress", () => {
  it("gives every topic a status, in the given order", () => {
    const rows = topicProgress(
      [observation("b", now - dayMs), observation("b", now)],
      new Map([["b", now]]),
      ["a", "b"],
      now,
    );
    expect(rows.map((r) => [r.topic, r.state, r.lastAt])).toEqual([
      ["a", "notStarted", null],
      ["b", "warming", now],
    ]);
  });
});

describe("suggest", () => {
  it("starts with the first topic on a first visit", () => {
    expect(
      suggest([topic("a", "notStarted"), topic("b", "notStarted")], []),
    ).toEqual({ topic: "a", reason: "first" });
  });

  it("returns to the last topic after two recent mistakes", () => {
    expect(
      suggest(
        [topic("a", "mastered", 1), topic("b", "inProgress", 2)],
        [false, true, false],
      ),
    ).toEqual({ topic: "b", reason: "stuck" });
  });

  it("moves on to the next topic not mastered", () => {
    expect(
      suggest(
        [
          topic("a", "inProgress", 1),
          topic("b", "mastered", 5),
          topic("c", "review", 2),
          topic("d", "notStarted"),
        ],
        [true],
      ),
    ).toEqual({ topic: "d", reason: "next" });
  });

  it("tells how close the last topic is", () => {
    expect(suggest([topic("a", "inProgress", 1, true)], [true])?.reason).toBe(
      "almost",
    );
    expect(suggest([topic("a", "warming", 1)], [true])?.reason).toBe("started");
  });

  it("keeps the last topic once every topic is mastered", () => {
    expect(
      suggest([topic("a", "mastered", 1), topic("b", "review")], [true]),
    ).toEqual({ topic: "a", reason: "done" });
  });
});
