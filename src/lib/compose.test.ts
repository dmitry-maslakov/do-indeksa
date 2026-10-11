import { describe, expect, it } from "vitest";
import { compose, swap } from "./compose";

const pool = {
  byPosition: [["a1", "a2"], ["b1", "b2"], ["c1"]],
  tasks: [
    { id: "a1", topic: "a" },
    { id: "a2", topic: "a" },
    { id: "b1", topic: "b" },
    { id: "b2", topic: "b" },
    { id: "c1", topic: "c" },
  ],
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
    const solved = new Set(pool.tasks.map((t) => t.id));
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
    const tasks = [...pool.tasks, { id: "a3", topic: "a" }];
    expect(swap(tasks, ["a2", "b1"], 0)).toEqual(["a3", "b1"]);
    expect(swap(tasks, ["a3", "b1"], 0)).toEqual(["a1", "b1"]);
  });

  it("skips tasks already in the variant", () => {
    expect(swap(pool.tasks, ["b1", "b2"], 0)).toBeUndefined();
    expect(swap(pool.tasks, ["c1"], 0)).toBeUndefined();
  });
});
