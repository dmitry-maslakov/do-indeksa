import { describe, expect, it } from "vitest";
import { inferKind, kindProblem } from "./kinds";

describe("inferKind", () => {
  it.each([
    ["2", "value"],
    ["\\frac{45}{2}", "value"],
    ["2\\sqrt{3}", "value"],
    ["60^\\circ", "value"],
    ["\\sqrt[3]{2b^{2}}", "value"],
    ["1{,}5", "value"],
    ["-\\infty", "value"],
    ["x+2", "value"],
    ["4, \\sqrt{2}", "values"],
    ["\\frac{\\pi}{3}, \\frac{2\\pi}{3}", "values"],
    ["\\sqrt[3]{2}, 4", "values"],
    ["3+i\\sqrt{6}, 3-i\\sqrt{6}", "values"],
    ["(-\\infty,-1)\\cup(0,1)", "interval"],
    [
      "\\left(-\\frac{1}{6},0\\right)\\cup\\left(4,\\frac{9}{2}\\right)",
      "interval",
    ],
    ["(-\\infty,0]", "interval"],
    ["[-2,+\\infty)", "interval"],
    ["(\\log_{2}3,+\\infty)", "interval"],
    ["(-1,4]", "interval"],
    ["[\\pi,2\\pi]", "interval"],
    ["[-\\frac{16}{7},-1)", "interval"],
    ["(0,\\frac{2}{3})\\cup\\{1\\}", "interval"],
    ["\\{3,2-i\\}", "interval"],
    ["(2,1,-1)", "point"],
    ["(\\frac{3}{5},\\frac{4}{5},\\frac{4}{3})", "point"],
    ["(\\frac{3}{2}(9-\\sqrt{65}),-6,\\frac{3}{2}(9+\\sqrt{65}))", "point"],
    ["(2,6,18,30)", "point"],
    ["(1,1), (\\log_{7}2,\\log_{2}7)", "points"],
    ["(3,5,7), (4,5,6), (5,5,5)", "points"],
    ["(125,4),(625,3)", "points"],
    ["(3,2)", null],
    ["(-1,1)", null],
    ["\\left(-\\frac{\\sqrt{3}}{3},5+\\frac{8\\sqrt{3}}{9}\\right)", null],
    ["\\emptyset", null],
  ] as const)("reads %s as %s", (expected, kind) => {
    expect(inferKind(expected)).toBe(kind);
  });
});

describe("kindProblem", () => {
  it.each([
    ["value", "2", null],
    ["value", "\\frac{45}{2}", null],
    ["values", "4, \\sqrt{2}", null],
    ["values", "2", null],
    ["values", "\\emptyset", null],
    ["interval", "(-\\infty,0)\\cup(2,+\\infty)", null],
    ["interval", "(-2,2)", null],
    ["interval", "[1,4]\\cup\\{6\\}", null],
    ["interval", "\\emptyset", null],
    ["point", "(3,2)", "(x, y)"],
    ["point", "(0,1,2)", "(x,y,z)"],
    ["point", "(0,1,2)", "T"],
    ["point", "(\\frac{1}{2},3)", null],
    ["points", "(3,2), (1,1)", "(x, y)"],
    ["points", "(3,2)", "(x, y)"],
    ["points", "(0,1,2), (1,1,1)", "(a, b, c)"],
    [null, "(3,2)", "(x, y)"],
    [null, "(0,1,2)", "(x, y, z)"],
    [null, "(1,1), (2,3)", "(x, y)"],
    [null, "(-2,2)", "m"],
    [null, "(-2,2)", null],
    [null, "\\emptyset", "(x, y)"],
    [null, "2", "(x, y)"],
    [null, "(1,2)\\cup[3,4]", "D"],
  ] as const)("accepts %s for %s with var %s", (kind, expected, variable) => {
    expect(kindProblem(kind, expected, variable)).toBeUndefined();
  });

  it.each([
    ["value", "1, 4", null],
    ["value", "(-2,2)", null],
    ["value", "(2,1,-1)", null],
    ["value", "(-\\infty,0)\\cup(2,+\\infty)", null],
    ["values", "(-2,2)", null],
    ["values", "(1,1), (2,3)", null],
    ["values", "(-\\infty,0)\\cup(2,+\\infty)", null],
    ["interval", "1, 4", null],
    ["interval", "3", null],
    ["interval", "(1,2),(3,4)", null],
    ["interval", "(1,2,3)", null],
    ["interval", "(0,\\infty]", null],
    ["interval", "[-\\infty,0)", null],
    ["interval", "(-\\infty,0)\\cup(2,3", null],
    ["point", "2", null],
    ["point", "(3,2), (1,1)", null],
    ["point", "(3,2)", "(x, y, z)"],
    ["point", "(0,1,2)", "(x, y)"],
    ["points", "(3,2), (1,1,1)", "(x, y)"],
    ["points", "1, 4", null],
    [null, "(1,2,3)", "(x, y)"],
    [null, "(3,2)", "(x, y, z)"],
    [null, "(1,1), (2,3,4)", "(x, y)"],
  ] as const)("rejects %s for %s with var %s", (kind, expected, variable) => {
    expect(kindProblem(kind, expected, variable)).toEqual(expect.any(String));
  });
});
