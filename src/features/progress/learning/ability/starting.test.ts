import { describe, expect, it } from "vitest";
import { defaultPolicy } from "../policy";
import { obs } from "../status/observations.fixture";
import type { Observation } from "../types";
import { abilityOf } from "./elo";
import { startingAbility, topicAbilities } from "./starting";

const inTopic = (topic: string, observations: Observation[]) =>
  observations.map((o) => ({ ...o, topic }));

describe("startingAbility", () => {
  it("starts from the policy without other topics", () => {
    expect(startingAbility([])).toBe(defaultPolicy.startAbility);
  });

  it("starts from the mean of the other topics", () => {
    expect(startingAbility([0, 1])).toBe(0.5);
  });
});

describe("topicAbilities", () => {
  it("starts every topic from the policy for a new student", () => {
    expect(topicAbilities(["a", "b"], new Map())).toEqual(
      new Map([
        ["a", defaultPolicy.startAbility],
        ["b", defaultPolicy.startAbility],
      ]),
    );
  });

  it("starts a topic without observations from the practiced ones", () => {
    const a = inTopic("a", [obs("clean", { hours: 0 })]);
    const b = inTopic("b", [obs("fail", { hours: 1 })]);
    const abilities = topicAbilities(
      ["a", "b", "c"],
      new Map([
        ["a", a],
        ["b", b],
      ]),
    );
    expect(abilities.get("c")).toBeCloseTo(
      ((abilities.get("a") ?? 0) + (abilities.get("b") ?? 0)) / 2,
    );
  });

  it("starts a topic from the others as they were when it began", () => {
    const a = inTopic("a", [
      obs("clean", { hours: 0 }),
      obs("clean", { hours: 1 }),
      obs("fail", { hours: 5 }),
    ]);
    const b = inTopic("b", [obs("clean", { hours: 2 })]);
    const abilities = topicAbilities(
      ["a", "b"],
      new Map([
        ["a", a],
        ["b", b],
      ]),
    );
    const startOfB = abilityOf(a.slice(0, 2), defaultPolicy.startAbility);
    expect(abilities.get("a")).toBeCloseTo(
      abilityOf(a, defaultPolicy.startAbility),
    );
    expect(abilities.get("b")).toBeCloseTo(abilityOf(b, startOfB));
  });
});
