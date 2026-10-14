import { describe, expect, it } from "vitest";
import { pick } from "./pick";

const groups = [["a1", "a2"], ["b1"], [], ["c1", "c2", "c3"], ["d1"]];

describe("pick", () => {
  it("is stable for a seed", () => {
    expect(pick(groups, 3, "daily-2026-10-07")).toEqual(
      pick(groups, 3, "daily-2026-10-07"),
    );
  });

  it("takes one item from distinct groups in group order", () => {
    const picked = pick(groups, 3, "random-1");
    const indexes = picked.map((p) => groups.findIndex((g) => g.includes(p)));
    expect(picked).toHaveLength(3);
    expect(indexes).toEqual([...new Set(indexes)].sort());
  });

  it("skips empty groups and caps the size", () => {
    expect(pick(groups, 10, "random-2")).toHaveLength(4);
  });

  it("varies with the seed", () => {
    const seen = new Set(
      Array.from({ length: 20 }, (_, i) => pick(groups, 2, `s${i}`).join()),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});
