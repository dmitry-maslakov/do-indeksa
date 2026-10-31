import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { defaultPolicy } from "../../policy";
import type { TaskHistory } from "../../state";
import { obs, start } from "../../status/observations.fixture";
import { candidate, history, learningAt, logit } from "../learning.fixture";
import { examTask } from "./exam-task";
import { hardNeeded } from "./hard-needed";
import { levelFit } from "./level-fit";
import { newType } from "./new-type";
import { repeatDue } from "./repeat-due";

const context = (
  ability: number,
  observations = [obs("clean", {})],
  policy = defaultPolicy,
) => ({
  learning: learningAt(ability, observations),
  candidates: [],
  picked: [],
  policy,
  now: start,
});

describe("levelFit", () => {
  it("fits best where the chance is the target", () => {
    expect(levelFit.score(candidate("t", 3), context(logit(0.7)))).toBeCloseTo(
      1,
    );
    expect(levelFit.score(candidate("t", 3), context(0))).toBeCloseTo(
      1 - 0.2 / 0.7,
    );
  });

  it("prefers easier tasks for a weaker student", () => {
    const weak = context(-1);
    expect(levelFit.score(candidate("t", 1), weak)).toBeGreaterThan(
      levelFit.score(candidate("t", 3), weak),
    );
  });

  it("aims at the target chance of the policy it is given", () => {
    const policy = { ...defaultPolicy, targetChance: 0.5 };
    expect(
      levelFit.score(candidate("t", 3), context(0, undefined, policy)),
    ).toBeCloseTo(1);
  });

  it("scores nothing for a topic it has no state for", () => {
    expect(
      levelFit.score({ ...candidate("t", 3), topic: "astrology" }, context(0)),
    ).toBe(0);
  });
});

describe("hardNeeded", () => {
  it("boosts hard tasks while clean hard results are missing", () => {
    expect(hardNeeded.score(candidate("t", 3), context(0))).toBe(1);
    expect(hardNeeded.score(candidate("t", 4), context(0))).toBe(1);
    expect(hardNeeded.score(candidate("t", 2), context(0))).toBe(0);
  });

  it("waits until the chance on d3 reaches the threshold", () => {
    expect(hardNeeded.score(candidate("t", 3), context(logit(0.4)))).toBe(1);
    expect(hardNeeded.score(candidate("t", 3), context(logit(0.39)))).toBe(0);
  });

  it("stops once the window has enough clean hard results", () => {
    const hard = [0, 1, 2].map((hours) => obs("clean", { hours }));
    expect(hardNeeded.score(candidate("t", 3), context(0, hard))).toBe(0);
  });
});

describe("examTask", () => {
  it("scores real exam tasks", () => {
    expect(examTask.score(candidate("t", 2, true), context(0))).toBe(1);
    expect(examTask.score(candidate("t", 2), context(0))).toBe(0);
  });
});

describe("newType", () => {
  const ofType = (type: string) => ({ ...candidate("t", 3), type });
  const window = [
    obs("clean", { type: "substitution" }),
    obs("helped", { hours: 1, type: "graph" }),
  ];

  it("scores a type without a clean result in the topic's window", () => {
    expect(newType.score(ofType("graph"), context(0, window))).toBe(1);
    expect(newType.score(ofType("bases"), context(0, window))).toBe(1);
    expect(newType.score(ofType("substitution"), context(0, window))).toBe(0);
  });

  it("scores nothing for a topic it has no state for", () => {
    expect(
      newType.score({ ...ofType("graph"), topic: "astrology" }, context(0)),
    ).toBe(0);
  });
});

describe("repeatDue", () => {
  const scoreOf = (over: Partial<TaskHistory>, taskId = "t") =>
    repeatDue.score(candidate(taskId, 2), {
      learning: learningAt(0, [], { t: history(over) }),
      candidates: [],
      picked: [],
      policy: defaultPolicy,
      now: start,
    });

  it("scores a due task by the result of its last try", () => {
    expect(
      (["wrong", "partlyRight", "helped", "clean"] as const).map((lastResult) =>
        scoreOf({ lastResult }),
      ),
    ).toEqual([1, 0.75, 0.5, 0.25]);
  });

  it("scores nothing before the task is due or without a history", () => {
    expect(scoreOf({ dueAt: start + 1 })).toBe(0);
    expect(scoreOf({}, "other")).toBe(0);
  });

  it("breaks a tie toward the longest overdue, below the next priority", () => {
    const week = scoreOf({ dueAt: start - 7 * dayMs });
    expect(week).toBeCloseTo(1.1);
    expect(scoreOf({ dueAt: start - dayMs })).toBeLessThan(week);
    expect(
      scoreOf({ lastResult: "partlyRight", dueAt: start - 365 * dayMs }),
    ).toBeLessThan(scoreOf({}));
  });
});
