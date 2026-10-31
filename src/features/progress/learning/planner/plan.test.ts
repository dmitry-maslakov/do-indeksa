import { describe, expect, it } from "vitest";
import { defaultPolicy } from "../policy";
import type { Signal } from "./contracts";
import { candidate, learningAt, learningOf } from "./learning.fixture";
import { plan, signalled } from "./plan";
import { signals } from "./signals/signals";
import { topicSignals } from "./topic-signals/topic-signals";

const learning = learningAt(0);

const easy = candidate("easy", 1);
const medium = candidate("medium", 2);
const hard = candidate("hard", 3);

const prefers = (name: Signal["name"], taskIds: string[]): Signal => ({
  name,
  score: ({ taskId }) => (taskIds.includes(taskId) ? 1 : 0),
});

const varied: Signal = {
  name: "levelFit",
  score: ({ difficulty }, { picked }) =>
    picked.at(-1)?.difficulty === difficulty ? 0 : 1,
};

describe("plan", () => {
  it("picks the highest total and names the largest contribution", () => {
    const picks = plan(
      [easy, medium, hard],
      learning,
      [
        prefers("levelFit", ["easy", "medium"]),
        prefers("hardNeeded", ["medium"]),
        prefers("examTask", ["hard"]),
      ],
      2,
      [],
      {
        ...defaultPolicy,
        signalWeights: {
          ...defaultPolicy.signalWeights,
          levelFit: 0.4,
          hardNeeded: 0.5,
          examTask: 0.1,
        },
      },
    );
    expect(picks).toEqual([
      { candidate: medium, reason: "hardNeeded" },
      { candidate: easy, reason: "levelFit" },
    ]);
  });

  it("keeps the candidate order on a tie", () => {
    expect(
      plan([easy, medium], learning, [prefers("levelFit", [])], 1),
    ).toEqual([{ candidate: easy, reason: "levelFit" }]);
  });

  it("picks nothing without signals", () => {
    expect(plan([easy, medium], learning, [], 1)).toEqual([]);
  });

  it("passes the candidates picked so far to the signals", () => {
    const again = candidate("again", 1);
    expect(
      plan([easy, again, medium], learning, [varied], 3).map(
        (p) => p.candidate.taskId,
      ),
    ).toEqual(["easy", "medium", "again"]);
    expect(
      plan([easy, medium], learning, [varied], 1, [candidate("before", 1)]),
    ).toEqual([{ candidate: medium, reason: "levelFit" }]);
  });

  it("stops at the size or when the candidates run out", () => {
    expect(plan([easy, medium, hard], learning, signals, 2)).toHaveLength(2);
    expect(plan([easy, medium, hard], learning, signals, 5)).toHaveLength(3);
    expect(plan([easy], learning, signals, 0)).toEqual([]);
  });

  it("nudges toward d3 for a student who can take it", () => {
    expect(plan([medium, hard], learning, signals, 1)).toEqual([
      { candidate: hard, reason: "levelFit" },
    ]);
    expect(plan([medium, hard], learningAt(-0.5), signals, 1)).toEqual([
      { candidate: medium, reason: "levelFit" },
    ]);
  });

  it("plans over topic candidates as well", () => {
    const topics = learningOf({ a: {}, b: { state: "review" } });
    expect(
      plan([{ topic: "a" }, { topic: "b" }], topics, topicSignals, 2),
    ).toEqual([
      { candidate: { topic: "b" }, reason: "review" },
      { candidate: { topic: "a" }, reason: "startNext" },
    ]);
  });
});

describe("signalled", () => {
  it("keeps the candidates some signal scores", () => {
    expect(
      signalled([easy, medium, hard], learning, [
        prefers("levelFit", ["medium"]),
        prefers("examTask", ["hard"]),
      ]),
    ).toEqual([medium, hard]);
    expect(signalled([easy], learning, [prefers("levelFit", [])])).toEqual([]);
  });
});
