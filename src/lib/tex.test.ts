import { describe, expect, it } from "vitest";
import { groupOf, squash, topLevel } from "./tex";

describe("squash", () => {
  it.each([
    ["$ 1 , 4 $", "1,4"],
    ["\\left(1,\\ 4\\right]", "(1,4]"],
    ["\\dfrac12 + \\tfrac{3}{4}", "\\frac{1}{2}+\\frac{3}{4}"],
    ["\\sqrt3", "\\sqrt{3}"],
    ["\\lbrace 1,2\\rbrace", "\\{1,2\\}"],
    ["\\lbrack 1,2\\rbrack", "[1,2]"],
  ])("normalizes %s", (latex, squashed) => {
    expect(squash(latex)).toBe(squashed);
  });
});

describe("topLevel", () => {
  it.each([
    ["1,4", ["1", "4"]],
    ["(1,2),[3,4)", ["(1,2)", "[3,4)"]],
    ["\\{1,2\\},3", ["\\{1,2\\}", "3"]],
    ["\\frac{1,2}{3}", ["\\frac{1,2}{3}"]],
    ["", [""]],
  ])("splits %s at the commas outside brackets", (latex, items) => {
    expect(topLevel(latex)).toEqual(items);
  });
});

describe("groupOf", () => {
  it.each([
    ["(1,2)", { open: "(", close: ")", items: ["1", "2"] }],
    [
      "[-1,\\frac{1}{2})",
      { open: "[", close: ")", items: ["-1", "\\frac{1}{2}"] },
    ],
    ["((1,2),3)", { open: "(", close: ")", items: ["(1,2)", "3"] }],
    ["(x)", { open: "(", close: ")", items: ["x"] }],
  ])("reads %s as one bracketed group", (latex, group) => {
    expect(groupOf(latex)).toEqual(group);
  });

  it.each([
    ["1,2"],
    ["(1,2),(3,4)"],
    ["(1,2)\\cup(3,4)"],
    ["(1,2"],
    ["\\{1,2\\}"],
    [""],
  ])("does not read %s as one group", (latex) => {
    expect(groupOf(latex)).toBeNull();
  });
});
