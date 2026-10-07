import { describe, expect, it } from "vitest";
import { compose } from "./compose";

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
    const ids = compose(pool, input, "s");
    expect(ids.map((id) => id[0])).toEqual(["a", "b", "c"]);
  });

  it("draws only from chosen or weak topics", () => {
    expect(
      compose(pool, { ...input, mode: "topics", topics: ["b"] }, "s").sort(),
    ).toEqual(["b1", "b2"]);
    expect(compose(pool, { ...input, mode: "weak", weak: ["c"] }, "s")).toEqual(
      ["c1"],
    );
  });

  it("skips solved tasks", () => {
    const solved = new Set(["a1", "b1", "b2"]);
    expect(
      compose(pool, { ...input, mode: "unsolved", solved }, "s").sort(),
    ).toEqual(["a2", "c1"]);
  });

  it("falls back to the exam when nothing matches", () => {
    expect(
      compose(pool, { ...input, mode: "topics", topics: ["z"] }, "s"),
    ).toHaveLength(3);
  });
});
