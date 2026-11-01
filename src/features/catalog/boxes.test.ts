import { describe, expect, it } from "vitest";
import {
  arityOf,
  type BoxKind,
  blankLayout,
  boxesOf,
  decimalComma,
  grown,
  type Layout,
  layoutOf,
  pastedComma,
  pastedLayout,
  sentForm,
  sentOf,
  shrunk,
  splitAtComma,
  withBox,
  withBracket,
} from "./boxes";

const sent = (kind: BoxKind, expected: string) => sentForm({ expected, kind });

describe("sentForm", () => {
  it.each([
    ["values", "4, \\sqrt{2}", "4;\\sqrt{2}"],
    ["values", "\\frac{1}{2}, 0.25", "\\frac{1}{2};0{,}25"],
    ["values", "\\{-4,5\\}", "-4;5"],
    ["values", "\\emptyset", "\\emptyset"],
    ["point", "(0,1,2)", "(0;1;2)"],
    [
      "point",
      "(\\frac{3}{2}(9-\\sqrt{65}),-6)",
      "(\\frac{3}{2}(9-\\sqrt{65});-6)",
    ],
    ["points", "(2,\\frac{1}{2}), (1,1)", "(2;\\frac{1}{2});(1;1)"],
    [
      "interval",
      "(-\\infty,0)\\cup(2,+\\infty)",
      "(-\\infty;0)\\cup(2;+\\infty)",
    ],
    ["interval", "[-1,3]", "[-1;3]"],
    [
      "interval",
      "\\left[\\frac{\\pi}{6},\\frac{\\pi}{2}\\right]",
      "[\\frac{\\pi}{6};\\frac{\\pi}{2}]",
    ],
    ["interval", "(-\\infty,0)\\cup\\{1\\}", "(-\\infty;0)\\cup\\{1\\}"],
    ["interval", "\\{-4,5\\}", "\\{-4\\}\\cup\\{5\\}"],
    ["interval", "\\emptyset", "\\emptyset"],
  ] as const)("sends %s %s as %s", (kind, expected, text) => {
    expect(sent(kind, expected)).toBe(text);
  });

  it("keeps a value as it is, with the decimal comma", () => {
    expect(sentForm({ expected: "19.1" })).toBe("19{,}1");
    expect(sentForm({ expected: "(a,b)" })).toBe("(a,b)");
  });
});

describe("layoutOf and sentOf", () => {
  it.each([
    ["values", "1{,}5;2"],
    ["values", "1{,}4"],
    ["values", "1;"],
    ["point", "(3;2)"],
    ["point", "(\\frac{1}{2};\\sqrt{2};-1)"],
    ["point", "(1{,}5;2)"],
    ["points", "(1;2);(3;4)"],
    ["interval", "(-\\infty;-1)\\cup(0;1]"],
    ["interval", "[0;2)\\cup\\{3\\}"],
    ["interval", "(0{,}5;1)\\cup\\{1{,}4\\}"],
    ["interval", "(;)\\cup(0;1)"],
    ["values", "\\emptyset"],
    ["interval", "\\emptyset"],
  ] as const)("returns the sent text of %s %s", (kind, text) => {
    const layout = layoutOf(kind, text);
    expect(layout && sentOf(layout)).toBe(text);
  });

  it("reads boxes in order", () => {
    const layout = layoutOf("interval", "(-\\infty;-1)\\cup\\{0\\}\\cup[2;3)");
    expect(layout && boxesOf(layout)).toEqual([
      "-\\infty",
      "-1",
      "0",
      "2",
      "3",
    ]);
  });

  it("reads the boxes of the old style", () => {
    expect(layoutOf("values", "x\\in\\{1,\\ \\sqrt{2}\\}")).toEqual({
      kind: "values",
      boxes: ["1", "\\sqrt{2}"],
    });
    expect(
      layoutOf(
        "values",
        "\\theta\\in\\left\\{\\frac{\\pi}{6},\\frac{5\\pi}{6}\\right\\}",
      ),
    ).toEqual({
      kind: "values",
      boxes: ["\\frac{\\pi}{6}", "\\frac{5\\pi}{6}"],
    });
    expect(layoutOf("values", "\\alpha_1=-2;2")).toEqual({
      kind: "values",
      boxes: ["-2", "2"],
    });
    expect(layoutOf("point", "T=\\left(0,1,2\\right)")).toEqual({
      kind: "point",
      boxes: ["0", "1", "2"],
    });
    expect(layoutOf("interval", "\\left(1,2\\right\\rbrack")).toEqual({
      kind: "interval",
      pieces: [{ open: "(", from: "1", to: "2", close: "]" }],
    });
  });

  it("splits a lone decimal of an old tuple or interval, which cannot be one number", () => {
    expect(layoutOf("point", "(1{,}2)")).toEqual({
      kind: "point",
      boxes: ["1", "2"],
    });
    expect(layoutOf("points", "(1{,}2);(\\frac{1{,}5}{2}{,}3)")).toEqual({
      kind: "points",
      rows: [
        ["1", "2"],
        ["\\frac{1{,}5}{2}", "3"],
      ],
    });
    expect(layoutOf("interval", "\\left\\lbrack0{,}2\\right\\rbrack")).toEqual({
      kind: "interval",
      pieces: [{ open: "[", from: "0", to: "2", close: "]" }],
    });
  });

  it("does not read what has no boxes", () => {
    expect(layoutOf("interval", "(1;2;3)")).toBeNull();
    expect(layoutOf("point", "\\emptyset")).toBeNull();
  });

  it("sends nothing while every box is empty", () => {
    for (const kind of ["values", "point", "points", "interval"] as const)
      expect(sentOf(blankLayout(kind, 2))).toBe("");
  });

  it("changes one box by its place", () => {
    const layout = layoutOf("interval", "(0;1)\\cup\\{2\\}");
    const next = layout && withBox(layout, 2, "5");
    expect(next && sentOf(next)).toBe("(0;1)\\cup\\{5\\}");
  });
});

describe("editing the boxes", () => {
  const sentAfter = (layout: Layout | null) => layout && sentOf(layout);

  it("adds a box, a row, a piece or an isolated point", () => {
    const values = layoutOf("values", "1;2");
    expect(sentAfter(values && withBox(grown(values, 0), 2, "3"))).toBe(
      "1;2;3",
    );
    const points = layoutOf("points", "(1;2)");
    expect(sentAfter(points && withBox(grown(points, 2), 2, "3"))).toBe(
      "(1;2);(3;)",
    );
    const interval = layoutOf("interval", "(0;1)");
    expect(sentAfter(interval && withBox(grown(interval, 0), 2, "3"))).toBe(
      "(0;1)\\cup(3;)",
    );
    expect(
      sentAfter(interval && withBox(grown(interval, 0, true), 2, "3")),
    ).toBe("(0;1)\\cup\\{3\\}");
  });

  it("removes a box but keeps the last one", () => {
    const values = layoutOf("values", "1;2");
    expect(sentAfter(values && shrunk(values, 0))).toBe("2");
    const one = layoutOf("values", "1");
    expect(sentAfter(one && shrunk(one, 0))).toBe("1");
  });

  it("sets the brackets of a piece and keeps an infinite end round", () => {
    const interval = layoutOf("interval", "(-\\infty;1)");
    expect(sentAfter(interval && withBracket(interval, 0, "["))).toBe(
      "(-\\infty;1)",
    );
    expect(sentAfter(interval && withBracket(interval, 0, "]"))).toBe(
      "(-\\infty;1]",
    );
    const finite = layoutOf("interval", "(0;1)");
    expect(sentAfter(finite && withBracket(finite, 0, "["))).toBe("[0;1)");
  });

  it("rounds a bracket when its end becomes infinite", () => {
    const interval = layoutOf("interval", "[0;1]");
    expect(sentAfter(interval && withBox(interval, 0, "-\\infty"))).toBe(
      "(-\\infty;1]",
    );
    expect(sentAfter(interval && withBox(interval, 1, "\\infty"))).toBe(
      "[0;\\infty)",
    );
  });
});

describe("splitAtComma", () => {
  const split = (kind: BoxKind, text: string, flat = 0) => {
    const layout = layoutOf(kind, text);
    return layout && sentOf(splitAtComma(layout, flat));
  };

  it("lays the decimal comma of an interval typed in one go into two ends", () => {
    expect(split("interval", "(0{,}1;)")).toBe("(0;1)");
    expect(split("interval", "[-1{,}\\frac{1}{2};)")).toBe("[-1;\\frac{1}{2})");
    expect(split("interval", "(0;1)\\cup(2{,}3;)", 2)).toBe("(0;1)\\cup(2;3)");
  });

  it("splits a coordinate list typed in one go over the empty boxes", () => {
    expect(split("point", "(1{,}2{,}3;;)")).toBe("(1;2;3)");
    expect(split("point", "(1{,}2{,}3;)")).toBe("(1{,}2{,}3;)");
  });

  it("keeps a decimal that has nothing to be split from", () => {
    expect(split("interval", "(0{,}5;1)")).toBe("(0{,}5;1)");
    expect(split("interval", "(0{,}5;)")).toBe("(0;5)");
    expect(split("interval", "(1;2{,}5)", 1)).toBe("(1;2{,}5)");
    expect(split("interval", "(\\frac{1{,}5}{2};)")).toBe(
      "(\\frac{1{,}5}{2};)",
    );
    expect(split("interval", "(1{,};)")).toBe("(1{,};)");
  });
});

describe("pastedLayout", () => {
  it.each([
    ["interval", "[0,2]", "[0;2]"],
    ["interval", "x\\in[0,2]", "[0;2]"],
    [
      "interval",
      "(-∞,-1)∪(0,1)∪(1,+∞)",
      "(-\\infty;-1)\\cup(0;1)\\cup(1;+\\infty)",
    ],
    ["point", "(3,2)", "(3;2)"],
    ["point", "(1,4)", "(1;4)"],
    ["points", "(1,2),(3,4)", "(1;2);(3;4)"],
    ["values", "1, 4", "1;4"],
    ["values", "1;4", "1;4"],
    ["values", "x = 0,25, -1,5", "0{,}25;-1{,}5"],
  ] as const)("lays %s %s out in boxes", (kind, text, sent) => {
    const layout = pastedLayout(kind, text, 2);
    expect(layout && sentOf(layout)).toBe(sent);
  });

  it.each([
    ["values", "1,4"],
    ["values", "-1,5"],
    ["interval", "5"],
    ["interval", "\\emptyset"],
    ["point", "(1,2,3)"],
    ["point", "7"],
  ] as const)("leaves %s %s to the field", (kind, text) => {
    expect(pastedLayout(kind, text, 2)).toBeNull();
  });
});

describe("pastedComma", () => {
  it("reads a comma between digits as the decimal comma of the field", () => {
    expect(pastedComma("1,4")).toBe("1{,}4");
    expect(pastedComma("-1,5")).toBe("-1{,}5");
    expect(pastedComma("0,25")).toBe("0{,}25");
    expect(pastedComma("\\frac{1,5}{2}")).toBe("\\frac{1{,}5}{2}");
  });

  it("leaves a comma with a space or next to a letter as it is", () => {
    expect(pastedComma("1, 4")).toBe("1, 4");
    expect(pastedComma("2\\pi,3")).toBe("2\\pi,3");
    expect(pastedComma("x,1")).toBe("x,1");
  });
});

describe("arityOf", () => {
  it.each([
    [{ expected: "(1,2,3)", kind: "point" as const }, 3],
    [{ expected: "(1,2)", kind: "point" as const, var: "(x,y,z)" }, 3],
    [{ expected: "(1,2),(3,4)", kind: "points" as const }, 2],
    [{ expected: "(1,2)", kind: "point" as const, var: "T" }, 2],
  ])("counts the boxes of %j", (part, size) => {
    expect(arityOf(part)).toBe(size);
  });
});

describe("decimalComma", () => {
  it("writes the decimal point of the key as the comma the field uses", () => {
    expect(decimalComma("19.1")).toBe("19{,}1");
    expect(decimalComma("x=0.3010275")).toBe("x=0{,}3010275");
    expect(decimalComma("1.5+2.25")).toBe("1{,}5+2{,}25");
  });

  it("leaves everything else as it is", () => {
    expect(decimalComma("\\frac{60}{13}")).toBe("\\frac{60}{13}");
    expect(decimalComma("19{,}1")).toBe("19{,}1");
    expect(decimalComma("x.")).toBe("x.");
  });
});
