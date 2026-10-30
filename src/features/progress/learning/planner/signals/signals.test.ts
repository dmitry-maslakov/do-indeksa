import { describe, expect, it } from "vitest";
import { defaultPolicy } from "../../policy";
import { obs } from "../../status/observations.fixture";
import { candidate, learningAt } from "../learning.fixture";
import { examTask } from "./exam-task";
import { hardNeeded } from "./hard-needed";
import { levelFit } from "./level-fit";

const context = (
  ability: number,
  observations = [obs("clean", {})],
  policy = defaultPolicy,
) => ({
  learning: learningAt(ability, observations),
  picked: [],
  policy,
});

const logit = (p: number) => Math.log(p / (1 - p));

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
