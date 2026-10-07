import { describe, expect, it } from "vitest";
import { isEquivalent } from "./math";

describe("isEquivalent", () => {
  it.each([
    ["\\frac{4\\pi}{6}", "\\frac{2\\pi}{3}"],
    ["\\sqrt{12}", "2\\sqrt{3}"],
    ["0{,}5x+2", "\\frac{x}{2}+2"],
    ["2-2x", "-2x+2"],
    ["\\frac{1}{3\\sqrt{3}}", "\\frac{\\sqrt{3}}{9}"],
    ["\\frac{\\pi}{3}", "60^\\circ"],
    ["60", "60^\\circ"],
    ["120^\\circ", "\\frac{2\\pi}{3}"],
    ["\\sqrt{2}, 4", "4, \\sqrt{2}"],
    ["x=5", "5"],
    ["\\left(0,1,2\\right)", "(0,1,2)"],
  ])("accepts %s for %s", (input, expected) => {
    expect(isEquivalent(input, expected)).toBe(true);
  });

  it.each([
    ["x+1", "x-1"],
    ["4{,}615", "\\frac{60}{13}"],
    ["4", "4, \\sqrt{2}"],
    ["4, 4", "4, \\sqrt{2}"],
    ["(2,1,0)", "(0,1,2)"],
    ["120", "\\frac{2\\pi}{3}"],
    ["\\frac{1", "1"],
    ["", "1"],
  ])("rejects %s for %s", (input, expected) => {
    expect(isEquivalent(input, expected)).toBe(false);
  });
});
