import { describe, expect, it } from "vitest";
import { splitLabel, uncheckedLetters } from "./parts";

describe("splitLabel", () => {
  it.each([
    [null, 0, 1, { letter: "", prefix: null, caption: null }],
    ["x", 0, 1, { letter: "", prefix: "x =", caption: null }],
    [
      "b) $F_{max}$",
      0,
      2,
      { letter: "b)", prefix: null, caption: "$F_{max}$" },
    ],
    ["a)", 1, 2, { letter: "a)", prefix: null, caption: null }],
    [
      "broj načina",
      1,
      2,
      { letter: "2.", prefix: null, caption: "broj načina" },
    ],
    [
      "na $[0,2\\pi)$",
      0,
      1,
      { letter: "", prefix: null, caption: "na $[0,2\\pi)$" },
    ],
  ] as const)("splits %j", (label, index, count, part) => {
    expect(splitLabel(label, index, count)).toEqual(part);
  });
});

describe("uncheckedLetters", () => {
  it("lists statement parts without an answer field", () => {
    const parts = [splitLabel("b) x", 0, 2), splitLabel("c) y", 1, 2)];
    expect(uncheckedLetters("**a)** foo **b)** bar **c)** baz", parts)).toEqual(
      ["a)"],
    );
  });
});
