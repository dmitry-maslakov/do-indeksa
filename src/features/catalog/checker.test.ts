import { describe, expect, it } from "vitest";
import { answerProblem, type GradedPart, gradeParts } from "./checker";
import type { Kind } from "./kinds";

const isEquivalent = (input: string, expected: string) =>
  gradeParts([{ expected }], [input])[0]?.outcome === "right";

describe("a part without a kind", () => {
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
    ["(2,\\infty)\\cup(-\\infty,0)", "(-\\infty,0)\\cup(2,+\\infty)"],
    ["x\\in(-1,0)\\cup(2,3)", "(-1,0)\\cup(2,3)"],
    ["[-1,\\frac{6}{2}]", "[-1,3]"],
    ["\\left\\lbrack0{,}2\\right\\rbrack", "[0,2]"],
    ["\\left(1{,}2\\right\\rbrack", "(1,2]"],
    ["0{,}5", "\\frac{1}{2}"],
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
    ["(-\\infty,0]\\cup(2,\\infty)", "(-\\infty,0)\\cup(2,\\infty)"],
    ["(-1,3)", "[-1,3]"],
    ["\\left\\lbrack0{,}3\\right\\rbrack", "[0,2]"],
    ["0{,}2", "[0,2]"],
    ["-1{,}1", "-1, 1"],
    ["\\frac{1", "1"],
    ["", "1"],
  ])("rejects %s for %s", (input, expected) => {
    expect(isEquivalent(input, expected)).toBe(false);
  });
});

describe("an answer with a variable", () => {
  it.each([
    ["y=24(x+5)", "24x+120"],
    ["(x+1)^2", "x^2+2x+1"],
    ["x+x", "2x"],
    ["\\frac{n(n-1)}{2}", "\\frac{n^2-n}{2}"],
    ["2r\\sin(15^\\circ)", "r\\sqrt{2-\\sqrt{3}}"],
    ["\\frac{\\sqrt{6}-\\sqrt{2}}{2}r", "r\\sqrt{2-\\sqrt{3}}"],
    ["(x-2)^2+(y-5)^2=4", "x^2+y^2-4x-10y+25=0"],
    ["2x^2+2y^2-8x-20y+50=0", "(x-2)^2+(y-5)^2=4"],
  ])("accepts %s for %s in another form", (input, expected) => {
    expect(isEquivalent(input, expected)).toBe(true);
  });

  it.each([
    ["x+1", "x+2"],
    ["y=24(x-5)", "24x+120"],
    ["(x+1)^2", "x^2+x+1"],
    ["\\frac{n(n+1)}{2}", "\\frac{n^2-n}{2}"],
    ["(x-2)^2+(y-5)^2=9", "(x-2)^2+(y-5)^2=4"],
    ["(x+2)^2+(y-5)^2=4", "x^2+y^2-4x-10y+25=0"],
    ["x+C", "x+5+C"],
  ])("rejects %s for %s", (input, expected) => {
    expect(isEquivalent(input, expected)).toBe(false);
  });
});

const outcomes = (parts: GradedPart[], answers: string[]) =>
  gradeParts(parts, answers).map((graded) => graded.outcome);

const grade = (expected: string, input: string, kind?: Kind) =>
  outcomes([{ expected, kind }], [input])[0];

describe("gradeParts", () => {
  it("grades each part and treats a missing answer as empty", () => {
    const parts = [{ expected: "2" }, { expected: "\\frac{1}{2}" }];
    expect(outcomes(parts, ["2"])).toEqual(["right", "empty"]);
    expect(outcomes(parts, ["1", "0{,}5"])).toEqual(["wrong", "right"]);
  });

  it.each([
    ["\\left\\lbrack3{,}+\\infty\\right)", "[3,+\\infty)"],
    [
      "\\left(-\\infty,-1\\right)\\cup\\left(0{,}1\\right)\\cup\\left(1{,}+\\infty\\right)",
      "(-\\infty,-1)\\cup(0,1)\\cup(1,+\\infty)",
    ],
  ])("grades %s as right for %s", (input, expected) => {
    expect(grade(expected, input)).toBe("right");
  });

  it.each(["", "  ", "\\placeholder{}"])("treats %j as empty", (input) => {
    expect(grade("1", input)).toBe("empty");
  });

  it.each(["\\frac{1", "(2,", "2+", "x=", "\\sqrt{}", "\\frac{}{}"])(
    "treats %j as unreadable",
    (input) => {
      expect(grade("1", input)).toBe("unreadable");
    },
  );
});

describe("choice", () => {
  const part = {
    expected: "both",
    kind: "choice" as const,
    options: ["right", "isosceles", "both", "neither"],
  };
  const graded = (answer: string) => gradeParts([part], [answer])[0];

  it("is right only for the expected option, with no partial credit", () => {
    expect(graded("both")).toEqual({ outcome: "right" });
    expect(graded("right")).toEqual({ outcome: "wrong" });
    expect(graded("neither")).toEqual({ outcome: "wrong" });
  });

  it("is empty when nothing is picked and unreadable for an unknown option", () => {
    expect(graded("")).toEqual({ outcome: "empty" });
    expect(graded("maybe")).toEqual({ outcome: "unreadable" });
    expect(graded("Both")).toEqual({ outcome: "unreadable" });
  });

  it("is satisfied by its expected option sent as it is", () => {
    expect(answerProblem(part)).toBeUndefined();
    expect(
      answerProblem({ expected: "no", kind: "choice", options: ["yes", "no"] }),
    ).toBeUndefined();
  });
});

describe("values", () => {
  it.each([
    ["1;4", "1, 4"],
    ["4;1", "1, 4"],
    ["1;1;4", "1, 4"],
    ["x=1;4", "1, 4"],
    ["x_1=1;4", "1, 4"],
    ["x\\in\\{1;4\\}", "1, 4"],
    ["1,4", "1, 4"],
    ["1{,}4", "1.4"],
    ["-1{,}5;0{,}25", "0.25, -1.5"],
    ["\\frac{1{,}5}{3}", "0.5"],
    ["2^{0{,}5}", "\\sqrt{2}"],
    ["\\frac12;3", "\\frac{1}{2}, 3"],
    ["0{,}5;3", "\\frac{1}{2}, 3"],
    ["\\pm2", "2, -2"],
    ["\\sqrt{2};4;", "4, \\sqrt{2}"],
    ["\\emptyset", "\\emptyset"],
  ])("accepts %s for %s", (input, expected) => {
    expect(grade(expected, input, "values")).toBe("right");
  });

  it.each([
    ["1;5", "1, 4"],
    ["1", "1, 4"],
    ["1;4;5", "1, 4"],
    ["1{,}4;2", "1, 4"],
    ["1{,}4", "1, 4"],
    ["\\emptyset", "1, 4"],
    ["1;4", "\\emptyset"],
  ])("rejects %s for %s", (input, expected) => {
    expect(grade(expected, input, "values")).toBe("wrong");
  });

  it("is empty when no box has anything", () => {
    expect(grade("1, 4", ";", "values")).toBe("empty");
  });

  it.each([
    ["\\alpha=\\{-2,2\\}", "-2, 2"],
    ["\\theta\\in\\{2;-2\\}", "-2, 2"],
    ["\\varphi_1=2;-2", "-2, 2"],
  ])("reads a Greek letter before the list in %s", (input, expected) => {
    expect(grade(expected, input, "values")).toBe("right");
  });

  describe("a set in braces", () => {
    const expected = "\\left\\{\\frac{\\pi}{6},\\frac{5\\pi}{6}\\right\\}";

    it.each([
      "\\frac{5\\pi}{6};\\frac{\\pi}{6}",
      "\\frac{\\pi}{6},\\frac{5\\pi}{6}",
      "\\theta\\in\\left\\{\\frac{\\pi}{6},\\frac{5\\pi}{6}\\right\\}",
      "x=\\frac{\\pi}{6};x=\\frac{5\\pi}{6}",
    ])("is read as a list: accepts %s", (input) => {
      expect(grade(expected, input)).toBe("right");
    });

    it("keeps a complex root apart from its real part", () => {
      expect(grade("\\{3,2-i\\}", "3;2-i")).toBe("right");
      expect(grade("\\{3,2-i\\}", "3;2+i")).toBe("wrong");
      expect(grade("\\{3,2-i\\}", "3;2")).toBe("wrong");
    });
  });
});

describe("a function typed with its key", () => {
  it.each([
    ["a\\ctg\\alpha", "a\\cot\\alpha"],
    ["3\\tg^2x+3\\tg^4x", "3\\tan^2 x+3\\tan^4 x"],
    ["2\\cos x-3\\sin x", "-3\\sin x+2\\cos x"],
    ["\\arccos\\frac{9}{10}", "\\arccos\\frac{9}{10}"],
    ["\\frac72+\\ln2", "\\frac{7}{2}+\\ln 2"],
  ])("accepts %s for %s", (input, expected) => {
    expect(grade(expected, input)).toBe("right");
  });

  it("is read in the boxes of a list and of an interval", () => {
    expect(grade("2\\arctan 2, \\pi", "\\pi;2\\arctg2", "values")).toBe(
      "right",
    );
    expect(
      grade(
        "[\\ln\\frac{4}{5},+\\infty)",
        "[\\ln\\frac45;+\\infty)",
        "interval",
      ),
    ).toBe("right");
  });

  it("is not taken for its inverse", () => {
    expect(grade("\\arctan 2", "\\tg2")).toBe("wrong");
  });
});

describe("a symbol typed with its key", () => {
  it.each([
    ["C_{25}^{2}", "300"],
    ["C_{n+1}^{k+1}x^{k}", "\\binom{n+1}{k+1}x^{k}"],
    ["V_{5}^{2}", "20"],
    ["V_5^2", "20"],
    ["P_{4}", "24"],
    ["P_4", "24"],
    ["P_{4}-V_{4}^{2}+2C_{5}^{2}", "32"],
    ["\\frac{P_{52}}{\\left(P_{13}\\right)^4}", "\\frac{52!}{(13!)^4}"],
    ["5!", "120"],
    ["6!\\cdot18!", "6!\\cdot 18!"],
    ["(n-2)(n-1)!", "(n-2)\\cdot(n-1)!"],
    ["\\frac{52!}{\\left(13!\\right)^4}", "\\frac{52!}{(13!)^4}"],
    ["2i+2", "2+2i"],
    ["\\frac{1+i}{1-i}", "i"],
    ["4e^{-2}", "\\frac{4}{e^{2}}"],
    ["e^3-e^2x+\\frac1e", "-e^{2}x+e^{3}+\\frac{1}{e}"],
    ["\\frac{3\\sqrt[3]{2}}{2}", "\\frac{3}{\\sqrt[3]{4}}"],
    ["2^{\\frac16}", "\\sqrt[6]{2}"],
    ["90^{\\circ}", "90^\\circ"],
    ["45^{\\circ}", "\\frac{\\pi}{4}"],
  ])("accepts %s for %s", (input, expected) => {
    expect(grade(expected, input)).toBe("right");
  });

  it.each([
    ["C_{25}^{3}", "300"],
    ["V_{5}^{2}", "10"],
    ["P_{4}", "4"],
    ["4!", "120"],
    ["-2i+2", "2+2i"],
    ["\\sqrt[3]{2}", "\\sqrt{2}"],
    ["30^{\\circ}", "\\frac{\\pi}{4}"],
  ])("rejects %s for %s", (input, expected) => {
    expect(grade(expected, input)).toBe("wrong");
  });

  it("is read in the boxes of a list", () => {
    expect(grade("0, -i, i", "i;-i;0", "values")).toBe("right");
    expect(grade("10, 6", "P_{3};C_{5}^{2}", "values")).toBe("right");
    expect(grade("\\sqrt[5]{5}, 5", "5;\\sqrt[5]{5}", "values")).toBe("right");
    expect(
      grade("\\frac{\\pi}{4}, \\arctan 2", "45^{\\circ};\\arctg2", "values"),
    ).toBe("right");
  });
});

describe("point and points", () => {
  it.each([
    ["(3;2)", "(3,2)"],
    ["3;2", "(3,2)"],
    ["(x;y)=(3;2)", "(3,2)"],
    ["\\left(3{,}0;2\\right)", "(3,2)"],
    ["(3,2)", "(3,2)"],
    ["(3{,}5;2)", "(\\frac{7}{2},2)"],
    ["(\\frac12;\\sqrt{4};0)", "(0.5,2,0)"],
  ])("accepts %s for %s", (input, expected) => {
    expect(grade(expected, input, "point")).toBe("right");
  });

  it.each([
    ["(2;3)", "(3,2)"],
    ["(3;2;1)", "(3,2)"],
    ["(3)", "(3,2)"],
  ])("rejects %s for %s", (input, expected) => {
    expect(grade(expected, input, "point")).toBe("wrong");
  });

  it.each([
    ["(1;2);(3;4)", "(1,2),(3,4)"],
    ["(3;4);(1;2)", "(1,2),(3,4)"],
    ["(1,2),(3,4)", "(1,2),(3,4)"],
    ["(1;2);(3;4);", "(1,2),(3,4)"],
  ])("accepts %s for %s", (input, expected) => {
    expect(grade(expected, input, "points")).toBe("right");
  });

  it.each([
    ["(1;2)", "(1,2),(3,4)"],
    ["(1;2);(4;3)", "(1,2),(3,4)"],
  ])("rejects %s for %s", (input, expected) => {
    expect(grade(expected, input, "points")).toBe("wrong");
  });

  it("reads tuples of the old style, with a comma inside and ; between", () => {
    expect(grade("(1,2),(3,4)", "(1{,}2);(3{,}4)", "points")).toBe("right");
    expect(grade("(1,2),(3,4)", "(3{,}4);(1{,}2)", "points")).toBe("right");
    expect(grade("(1,2)", "(1{,}2)", "point")).toBe("right");
    expect(grade("(1,2),(3,4)", "(1{,}2);(4{,}3)", "points")).toBe("wrong");
  });

  it("keeps a decimal comma inside a tuple of the new style", () => {
    expect(grade("(1,5)", "(1{,}5;2)", "point")).toBe("wrong");
    expect(grade("(\\frac{3}{2},5)", "(1{,}5;5)", "point")).toBe("right");
  });
});

describe("interval", () => {
  const expected = "(-\\infty,-1)\\cup(0,1]";

  it.each([
    "(-\\infty;-1)\\cup(0;1]",
    "(-\\infty;-1)\\cup(0;1.0]",
    "(0;1]\\cup(-\\infty;-1)",
    "(-\\infty;-1)\\cup(0;\\frac{2}{2}]",
    "(-\\infty;-1)\\cup(0;0.5]\\cup(0.5;1]",
    "(-\\infty;-1)\\cup(0;1)\\cup\\{1\\}",
    "x\\in(-\\infty;-1)\\cup(0;1]",
    "(-\\infty,-1)\\cup(0,1]",
    "\\left(-\\infty;-1\\right)\\cup\\left(0;1\\right\\rbrack",
    "[-\\infty;-1)\\cup(0;1]",
  ])("accepts %s", (input) => {
    expect(grade(expected, input, "interval")).toBe("right");
  });

  it.each([
    "(-\\infty;-1]\\cup(0;1]",
    "(-\\infty;-1)\\cup(0;1)",
    "(-\\infty;-1)\\cup[0;1]",
    "(-\\infty;-1)",
    "(-\\infty;-1)\\cup(0;2]",
    "(-1;-\\infty)\\cup(0;1]",
  ])("rejects %s", (input) => {
    expect(grade(expected, input, "interval")).toBe("wrong");
  });

  it("joins touching pieces and writes +\\infty as \\infty", () => {
    expect(grade("[0,+\\infty)", "[0;1)\\cup[1;\\infty)", "interval")).toBe(
      "right",
    );
    expect(
      grade("(-\\infty,+\\infty)", "(-\\infty;0]\\cup(0;\\infty)", "interval"),
    ).toBe("right");
    expect(grade("(0,1)\\cup(1,2)", "(0;2)", "interval")).toBe("wrong");
  });

  it("keeps the bracket of a symbolic end", () => {
    expect(grade("(-\\infty,a)", "(-\\infty;a)", "interval")).toBe("right");
    expect(grade("(-\\infty,a)", "(-\\infty;a]", "interval")).toBe("wrong");
  });

  it("compares symbolic ends by value", () => {
    expect(
      grade("(\\frac{\\pi}{3},\\log_{2}8]", "(\\frac{2\\pi}{6};3]", "interval"),
    ).toBe("right");
  });

  it("reads a set of points as one piece for each", () => {
    expect(grade("\\{-4,5\\}", "\\{-4\\}\\cup\\{5\\}", "interval")).toBe(
      "right",
    );
    expect(
      grade("(-\\infty,0)\\cup\\{1\\}", "(-\\infty;0)\\cup\\{1\\}", "interval"),
    ).toBe("right");
    expect(grade("(-\\infty,0)\\cup\\{1\\}", "(-\\infty;0)", "interval")).toBe(
      "wrong",
    );
  });

  it("reads a decimal comma in an end or a point as one number", () => {
    expect(grade("(0.5,2)", "(0{,}5;2)", "interval")).toBe("right");
    expect(grade("\\{1.4\\}", "\\{1{,}4\\}", "interval")).toBe("right");
    expect(grade("\\{1,4\\}", "\\{1{,}4\\}", "interval")).toBe("wrong");
  });

  it("accepts no solution", () => {
    expect(grade("\\emptyset", "\\emptyset", "interval")).toBe("right");
    expect(grade("(0,1)", "\\emptyset", "interval")).toBe("wrong");
  });
});

describe("the box that cannot be read", () => {
  const problem = (expected: string, input: string, kind: Kind) =>
    gradeParts([{ expected, kind }], [input])[0];

  it("names the unfinished fraction in the second box of a list", () => {
    expect(problem("1, 2", "1;\\frac{1}{\\placeholder{}}", "values")).toEqual({
      outcome: "unreadable",
      problem: { box: 1, reason: "fraction" },
    });
  });

  it("names an unclosed bracket", () => {
    expect(problem("1, 2", "\\left(1{,}5\\right?;2", "values")).toEqual({
      outcome: "unreadable",
      problem: { box: 0, reason: "bracket" },
    });
  });

  it("names the empty end of an interval", () => {
    expect(problem("(0,1)\\cup(2,3)", "(0;1)\\cup(2;)", "interval")).toEqual({
      outcome: "unreadable",
      problem: { box: 3, reason: "end" },
    });
  });

  it("names the box whose decimal comma swallowed the next one", () => {
    expect(
      problem("(0,1)\\cup(2,3)", "(0;1)\\cup(2{,}3;)", "interval"),
    ).toEqual({
      outcome: "unreadable",
      problem: { box: 2, reason: "decimal" },
    });
    expect(problem("(3,2)", "(3{,}2;)", "point")).toEqual({
      outcome: "unreadable",
      problem: { box: 0, reason: "decimal" },
    });
  });

  it("names the empty coordinate of a point", () => {
    expect(problem("(3,2)", "(3;)", "point")).toEqual({
      outcome: "unreadable",
      problem: { box: 1, reason: "coordinate" },
    });
  });

  it("ignores a piece or a row with nothing in it", () => {
    expect(grade("(0,1)", "(0;1)\\cup(;)", "interval")).toBe("right");
    expect(grade("(1,2),(3,4)", "(1;2);(3;4);(;)", "points")).toBe("right");
  });

  it("calls an unfilled place of a power unreadable, not wrong", () => {
    expect(problem("2", "2^{\\placeholder{}}", "value")).toEqual({
      outcome: "unreadable",
      problem: { box: 0, reason: "fraction" },
    });
    expect(problem("1, 2", "1;2^{\\placeholder{}}", "values")).toEqual({
      outcome: "unreadable",
      problem: { box: 1, reason: "fraction" },
    });
  });

  it("points at the single field of a value", () => {
    expect(problem("1", "2+", "value")).toEqual({
      outcome: "unreadable",
      problem: { box: 0, reason: "expression" },
    });
  });
});

describe("the unit", () => {
  it("is not needed and is dropped when typed", () => {
    const part = {
      expected: "(3,2)",
      kind: "point" as const,
      unit: "\\text{cm}",
    };
    expect(gradeParts([part], ["(3;2)\\text{cm}"])[0]?.outcome).toBe("right");
  });

  it("is dropped from a single value too", () => {
    const part = { expected: "120", unit: "\\text{cm}^2" };
    expect(gradeParts([part], ["120\\text{cm}^2"])[0]?.outcome).toBe("right");
    expect(gradeParts([part], ["121\\text{cm}^2"])[0]?.outcome).toBe("wrong");
  });
});

describe("answerProblem", () => {
  it.each([
    [{ expected: "4, \\sqrt{2}", kind: "values" as const }],
    [{ expected: "(0,1,2)", kind: "point" as const, var: "T" }],
    [{ expected: "(2,\\frac{1}{2}), (1,1)", kind: "points" as const }],
    [{ expected: "(-\\infty,0)\\cup\\{1\\}", kind: "interval" as const }],
    [{ expected: "0.3010275" }],
    [{ expected: "(3,2)" }],
    [{ expected: "\\emptyset", kind: "interval" as const }],
  ])("is satisfied by %j sent the way its boxes send it", (part) => {
    expect(answerProblem(part)).toBeUndefined();
  });

  it("names a part whose boxes cannot be laid out", () => {
    expect(answerProblem({ expected: "(1,2,3)", kind: "interval" })).toContain(
      "cannot be laid out",
    );
  });

  it("names a part that is not graded right when sent", () => {
    expect(
      answerProblem({ expected: "1, \\frac{1", kind: "values" }),
    ).toContain("is graded");
  });
});
