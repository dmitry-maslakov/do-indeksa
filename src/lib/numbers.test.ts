import { describe, expect, it } from "vitest";
import { atLeast, weightedMean } from "./numbers";

describe("atLeast", () => {
  it("ignores float error at the bound", () => {
    expect(atLeast(0.1 + 0.2, 0.3)).toBe(true);
    expect(atLeast(0.7 * 0.5 + 0.7 * 0.5 - 1e-15, 0.7)).toBe(true);
    expect(atLeast(0.69, 0.7)).toBe(false);
  });
});

describe("weightedMean", () => {
  it("weights each value", () => {
    const items = [
      { weight: 1, value: 1 },
      { weight: 3, value: 0 },
    ];
    expect(
      weightedMean(
        items,
        (i) => i.weight,
        (i) => i.value,
      ),
    ).toBe(0.25);
  });
});
