import { describe, expect, it } from "vitest";
import { defaultPolicy } from "../policy";
import { obs } from "../status/observations.fixture";
import type { Difficulty, Observation } from "../types";
import { abilityOf, chance } from "./elo";

const lastStep = (history: Observation[], next: Observation, from = 0) => {
  const before = abilityOf(history, from);
  const after = abilityOf([...history, next], from);
  return (after - before) / (next.credit - chance(before, next.difficulty));
};

describe("chance", () => {
  it.each([
    [-2, 1],
    [-1, 2],
    [0, 3],
    [1, 4],
  ] as [number, Difficulty][])(
    "is even at the anchor %i of d%i",
    (ability, difficulty) => {
      expect(chance(ability, difficulty)).toBeCloseTo(0.5);
    },
  );

  it("falls as the task gets harder", () => {
    expect(chance(0, 2)).toBeGreaterThan(chance(0, 3));
    expect(chance(0, 3)).toBeGreaterThan(chance(0, 4));
  });
});

describe("abilityOf", () => {
  it("stays at the start without observations", () => {
    expect(abilityOf([], -1)).toBe(-1);
  });

  it("moves up after a clean result and down after a fail", () => {
    expect(abilityOf([obs("clean", {})], 0)).toBeCloseTo(0.4);
    expect(abilityOf([obs("fail", {})], 0)).toBeCloseTo(-0.4);
    expect(abilityOf([obs("helped", {})], 0)).toBeCloseTo(-0.08);
  });

  it("replays observations in time order", () => {
    const history = [obs("fail", { hours: 2 }), obs("clean", { hours: 1 })];
    expect(abilityOf(history, 0)).toBe(abilityOf(history.toReversed(), 0));
  });

  it("takes smaller steps as evidence grows", () => {
    const history = Array.from({ length: 4 }, () => obs("clean", {}));
    expect(lastStep(history, obs("clean", {}))).toBeCloseTo(
      defaultPolicy.stepBase / (1 + defaultPolicy.stepDecay * 4),
    );
  });

  it("never steps below the floor", () => {
    const history = Array.from({ length: 50 }, (_, i) =>
      obs(i % 2 ? "clean" : "fail", {}),
    );
    expect(lastStep(history, obs("clean", {}))).toBeCloseTo(
      defaultPolicy.stepFloor,
    );
  });

  it("halves the evidence every seven days without practice", () => {
    const history = Array.from({ length: 4 }, () => obs("clean", {}));
    const weekLater = obs("clean", { hours: 7 * 24 });
    expect(lastStep(history, weekLater)).toBeCloseTo(
      defaultPolicy.stepBase / (1 + defaultPolicy.stepDecay * 2),
    );
    expect(lastStep(history, obs("clean", { hours: 14 * 24 }))).toBeGreaterThan(
      lastStep(history, weekLater),
    );
  });
});
