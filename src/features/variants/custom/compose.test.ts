import { describe, expect, it } from "vitest";
import { compose, swap } from "./compose";

const pool = {
  byPosition: [["a1", "a2"], ["b1", "b2"], ["c1"]],
  byTopic: new Map([
    ["a", ["a1", "a2"]],
    ["b", ["b1", "b2"]],
    ["c", ["c1"]],
  ]),
};
const input = {
  mode: "exam" as const,
  topics: [],
  weak: [],
  solved: new Set<string>(),
};

describe("compose", () => {
  it("takes one task per position like the exam", () => {
    const { ids, fallback } = compose(pool, input, "s");
    expect(ids.map((id) => id[0])).toEqual(["a", "b", "c"]);
    expect(fallback).toBe(false);
  });

  it("draws only from chosen or weak topics", () => {
    const topics = compose(
      pool,
      { ...input, mode: "topics", topics: ["b"] },
      "s",
    );
    expect(topics.ids.sort()).toEqual(["b1", "b2"]);
    expect(topics.fallback).toBe(false);
    expect(compose(pool, { ...input, mode: "weak", weak: ["c"] }, "s")).toEqual(
      { ids: ["c1"], fallback: false },
    );
  });

  it("limits the test to the chosen size", () => {
    expect(compose(pool, { ...input, size: 2 }, "s").ids).toHaveLength(2);
  });

  it("skips solved tasks", () => {
    const solved = new Set(["a1", "b1", "b2"]);
    const { ids, fallback } = compose(
      pool,
      { ...input, mode: "unsolved", solved },
      "s",
    );
    expect(ids.sort()).toEqual(["a2", "c1"]);
    expect(fallback).toBe(false);
  });

  it("falls back to the exam when nothing matches", () => {
    const solved = new Set(pool.byPosition.flat());
    for (const next of [
      { ...input, mode: "topics" as const, topics: ["z"] },
      { ...input, mode: "weak" as const },
      { ...input, mode: "unsolved" as const, solved },
    ]) {
      const { ids, fallback } = compose(pool, next, "s");
      expect(ids).toHaveLength(3);
      expect(fallback).toBe(true);
    }
  });
});

describe("swap", () => {
  it("cycles through the other tasks of the same topic", () => {
    const same = ["a1", "a2", "a3"];
    expect(swap(same, ["a2", "b1"], 0)).toEqual(["a3", "b1"]);
    expect(swap(same, ["a3", "b1"], 0)).toEqual(["a1", "b1"]);
  });

  it("skips tasks already in the variant", () => {
    expect(swap(["b1", "b2"], ["b1", "b2"], 0)).toBeUndefined();
    expect(swap(["c1"], ["c1"], 0)).toBeUndefined();
  });

  it("has nothing to swap in an unknown topic", () => {
    expect(swap([], ["z1"], 0)).toBeUndefined();
  });
});
