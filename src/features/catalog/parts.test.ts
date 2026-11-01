import { describe, expect, it } from "vitest";
import {
  answerAddsText,
  hasBareTex,
  labelOf,
  type PartMarkup,
  partProblem,
  partSchema,
  resultOf,
  statementLetters,
  symbolsIn,
  uncheckedLetters,
} from "./parts";

const markup = (part: Partial<PartMarkup>): PartMarkup => ({
  expected: "1",
  label: null,
  part: null,
  var: null,
  kind: null,
  unit: null,
  ...part,
});

const shown = (
  letter: string,
  prefix: string | null,
  suffix: string | null = null,
  caption: string | null = null,
) => ({ letter, prefix, suffix, caption });

describe("labelOf", () => {
  it.each([
    [{}, 0, 1, shown("", null)],
    [{ label: "x" }, 0, 1, shown("", "x $=$")],
    [{ label: "b) $F_{max}$" }, 0, 2, shown("b)", null, null, "$F_{max}$")],
    [{ label: "a)" }, 1, 2, shown("a)", null)],
    [{ label: "broj načina" }, 1, 2, shown("2.", null, null, "broj načina")],
    [
      { label: "na $[0,2\\pi)$" },
      0,
      1,
      shown("", null, null, "na $[0,2\\pi)$"),
    ],
    [{ label: "tangenta y =" }, 0, 1, shown("", "y $=$", null, "tangenta")],
    [
      { label: "kosa asimptota y =" },
      0,
      1,
      shown("", "y $=$", null, "kosa asimptota"),
    ],
    [
      { label: "horizontalna asimptota y =" },
      0,
      1,
      shown("", "y $=$", null, "horizontalna asimptota"),
    ],
    [
      { label: "lokalni minimum f(3) =" },
      0,
      1,
      shown("", "f(3) $=$", null, "lokalni minimum"),
    ],
    [
      { label: "vert. asimptota x =" },
      0,
      1,
      shown("", "x $=$", null, "vert. asimptota"),
    ],
    [{ label: "vrednost" }, 0, 1, shown("", null, null, "vrednost")],
    [
      { label: "najveća vrednost =" },
      0,
      1,
      shown("", null, null, "najveća vrednost"),
    ],
    [{ label: "a) ugao =" }, 0, 2, shown("a)", null, null, "ugao")],
    [{ label: "Stranice" }, 0, 1, shown("", null, null, "Stranice")],
    [{ label: "Im" }, 0, 1, shown("", "Im $=$")],
    [{ label: "AB: x =" }, 0, 1, shown("", "AB: x $=$")],
    [{ label: "(x,y)", expected: "(3,2)" }, 0, 1, shown("", "(x,y) $=$")],
    [
      { label: "(x, y)", expected: "(3,2)" },
      0,
      1,
      shown("", null, null, "(x, y)"),
    ],
  ] as const)("splits the legacy label of %j", (part, index, count, view) => {
    expect(labelOf(markup(part), index, count)).toMatchObject(view);
  });

  it.each([
    ["v) m", "v)"],
    ["g) m", "g)"],
    ["đ) m", "đ)"],
    ["e) m", "e)"],
  ])("reads the Serbian letter of %j", (label, letter) => {
    expect(labelOf(markup({ label }), 0, 2)).toMatchObject(
      shown(letter, "m $=$"),
    );
  });

  it("takes the letter from the part and leaves the label as a caption", () => {
    expect(
      labelOf(markup({ part: "đ", label: "dvostruki koren", var: "x" }), 0, 2),
    ).toMatchObject(shown("đ)", "$x$ $=$", null, "dvostruki koren"));
    expect(labelOf(markup({ part: "v", label: "a) drugi" }), 0, 2).letter).toBe(
      "v)",
    );
  });

  it.each([
    ["value", "1", "x", "$x$ $=$", null],
    ["values", "1, 4", "x", "$x$ $\\in\\{$", "$\\}$"],
    ["interval", "(-2,2)", "m", "$m$ $\\in$", null],
    ["interval", "(-\\infty,1]", "D", "$D$ $=$", null],
    ["point", "(3,2)", "(x, y)", "$(x, y)$ $=$", null],
    ["points", "(3,2), (1,1)", "(x, y)", "$(x, y)$ $\\in\\{$", "$\\}$"],
    ["values", "1, 4", null, "$\\{$", "$\\}$"],
    ["points", "(3,2), (1,1)", null, "$\\{$", "$\\}$"],
    ["interval", "(-2,2)", null, null, null],
    ["point", "(3,2)", null, null, null],
  ] as const)(
    "frames a %s part with var %j",
    (kind, expected, v, pre, post) => {
      expect(labelOf(markup({ kind, expected, var: v }), 0, 1)).toMatchObject(
        shown("", pre, post),
      );
    },
  );

  it("puts the unit after the field and after the closing brace", () => {
    expect(
      labelOf(markup({ var: "\\alpha", unit: "^\\circ" }), 0, 1),
    ).toMatchObject(shown("", "$\\alpha$ $=$", "$^\\circ$"));
    expect(
      labelOf(
        markup({ kind: "values", expected: "1, 2", unit: "\\text{cm}" }),
        0,
        1,
      ),
    ).toMatchObject(shown("", "$\\{$", "$\\}\\,\\text{cm}$"));
  });

  it.each([
    ["x", "1, 4", "x $\\in\\{$", "$\\}$"],
    ["x", "(-\\infty,-1)\\cup(0,1)", "x $\\in$", null],
    ["D", "(-\\infty,-1)\\cup(0,1)", "D $=$", null],
    ["D(f)", "(-\\infty,-4]\\cup[5,6]", "D(f) $=$", null],
    ["D_f", "(-\\infty,-4]\\cup[5,6]", "D_f $=$", null],
    ["x_1", "(-\\infty,-1)\\cup(0,1)", "x_1 $\\in$", null],
    ["x", "[1,4)", "x $\\in$", null],
    ["x", "\\frac{45}{2}", "x $=$", null],
    ["x", "(3,2)", "x $=$", null],
    ["P", "(0,1,2)", "P $=$", null],
    ["x", "(1,1), (2,3)", "x $\\in\\{$", "$\\}$"],
  ])(
    "reads the kind of a legacy part %j from %j",
    (label, expected, pre, post) => {
      expect(labelOf(markup({ label, expected }), 0, 1)).toMatchObject(
        shown("", pre, post),
      );
    },
  );

  it.each([
    ["values", "1, 4", null, "values", 0],
    ["point", "(3,2)", "(x, y)", "point", 2],
    ["point", "(1,2)", "(x, y, z)", "point", 3],
    ["points", "(1,2,3), (4,5,6)", null, "points", 3],
    [null, "(1,2,3)", null, "point", 3],
    [null, "(3,2)", null, null, 0],
    [null, "\\frac{1}{2}", null, "value", 0],
  ] as const)(
    "tells the field of a %s part with %j: %s, %s boxes",
    (given, expected, v, kind, arity) => {
      expect(
        labelOf(markup({ kind: given, expected, var: v }), 0, 1),
      ).toMatchObject({ kind, arity });
    },
  );
});

describe("resultOf", () => {
  it("writes each part as its unknown, relation and expected value", () => {
    expect(
      resultOf([
        markup({ part: "a", var: "m", expected: "4" }),
        markup({ part: "b", var: "x", kind: "values", expected: "1, 4" }),
        markup({
          part: "v",
          label: "odnos zapremina",
          expected: "\\frac{1}{2}",
        }),
      ]),
    ).toBe(
      "**a)** $m$ $=$ $4$\n\n**b)** $x$ $\\in\\{$ $1, 4$ $\\}$\n\n**v)** odnos zapremina $\\frac{1}{2}$",
    );
  });
});

describe("partProblem", () => {
  const letters = ["a)", "b)", "v)"];

  it("accepts a part the statement has and a kind that fits", () => {
    expect(partProblem(markup({ part: "v" }), letters)).toBeUndefined();
    expect(
      partProblem(
        markup({ part: "a", kind: "interval", expected: "(-2,2)" }),
        letters,
      ),
    ).toBeUndefined();
    expect(partProblem(markup({ label: "g) m" }), letters)).toBeUndefined();
  });

  it("rejects a part letter the statement does not have", () => {
    expect(partProblem(markup({ part: "g" }), letters)).toBe(
      'the statement has no part "g)", it has a) b) v)',
    );
    expect(partProblem(markup({ part: "a" }), [])).toBe(
      'the statement has no part "a)", it has no lettered parts',
    );
  });

  it("rejects a kind that does not fit the expected value", () => {
    expect(
      partProblem(markup({ kind: "value", expected: "1, 4" }), letters),
    ).toBe('kind "value" does not fit expected "1, 4" (fits: values)');
    expect(
      partProblem(
        markup({ kind: "point", var: "(x, y, z)", expected: "(3,2)" }),
        letters,
      ),
    ).toBe('"(3,2)" does not have the 3 components of var "(x, y, z)"');
  });

  it("checks the components of a tuple var against the kind read from expected", () => {
    expect(
      partProblem(markup({ var: "(x, y)", expected: "(1,2,3)" }), letters),
    ).toBe('"(1,2,3)" does not have the 2 components of var "(x, y)"');
    expect(
      partProblem(markup({ var: "(x, y, z)", expected: "(3,2)" }), letters),
    ).toBe('"(3,2)" does not have the 3 components of var "(x, y, z)"');
    expect(
      partProblem(markup({ var: "(x, y)", expected: "(3,2)" }), letters),
    ).toBeUndefined();
    expect(
      partProblem(markup({ var: "(x, y)", expected: "\\emptyset" }), letters),
    ).toBeUndefined();
  });
});

describe("partSchema", () => {
  const parse = (part: object) =>
    partSchema.safeParse({ expected: "1", ...part });

  it("accepts the fields of a checked part", () => {
    expect(
      parse({
        part: "đ",
        var: "(x, y)",
        kind: "point",
        unit: "\\text{cm}",
        label: "na $[0,2\\pi)$",
      }).success,
    ).toBe(true);
  });

  it.each([
    [{ part: "ab" }, "a single lowercase letter"],
    [{ part: "A" }, "a single lowercase letter"],
    [{ part: "" }, "a single lowercase letter"],
    [{ kind: "set" }, "Invalid option"],
    [{ var: "$x$" }, "TeX without $…$"],
    [{ unit: "^\\circ$" }, "TeX without $…$"],
    [{ var: "" }, "Too small"],
    [{ label: "x^2" }, "TeX outside $…$"],
    [{ label: "$x$ i y_1" }, "TeX outside $…$"],
  ])("rejects %j", (part, message) => {
    const result = parse(part);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});

describe("symbolsIn", () => {
  it("names the symbols the answers use, in the order of the symbol row", () => {
    expect(
      symbolsIn(["4, \\sqrt{2}", "(-\\infty,0)", "\\dfrac{\\pi}{2}"]),
    ).toEqual(["root", "pi", "fraction"]);
    expect(symbolsIn(["2^{n}", "\\log_2 3"])).toEqual(["power", "log"]);
    expect(symbolsIn(["6", "-1"])).toEqual([]);
  });
});

describe("statementLetters", () => {
  it("lists each lettered part once, Serbian letters included", () => {
    expect(
      statementLetters("**a)** x **b)** y **v)** z **g)** **đ)** **v)** w"),
    ).toEqual(["a)", "b)", "v)", "g)", "đ)"]);
  });
});

describe("hasBareTex", () => {
  it.each([
    ["b) z^2025", true],
    ["a) x_1", true],
    ["\\alpha", true],
    ["a) {x}", true],
    ["x $y^2", true],
    ["$a$ x^2 $b$", true],
    ["b) $z^{2025}$", false],
    ["na $[0,2\\pi)$", false],
    ["$$x_1$$ i $y^2$", false],
    ["a) arg z", false],
    ["a) |z|", false],
  ] as const)("flags %j as %j", (label, bare) => {
    expect(hasBareTex(label)).toBe(bare);
  });
});

describe("uncheckedLetters", () => {
  it("lists statement parts without an answer field", () => {
    const parts = [
      labelOf(markup({ label: "b) x" }), 0, 2),
      labelOf(markup({ part: "v" }), 1, 2),
    ];
    expect(
      uncheckedLetters("**a)** foo **b)** bar **v)** baz **đ)** qux", parts),
    ).toEqual(["a)", "đ)"]);
  });
});

describe("answerAddsText", () => {
  it.each([
    ["$x = 2$", ["2"]],
    ["$x_1 = 1$, $x_2 = 4$", ["1, 4"]],
    ["$x \\in \\left(1, 4\\right]$", ["(1,4]"]],
    ["$(x, y) = (3, 2)$", ["(3,2)"]],
    ["$x\\in(-\\infty,-1)\\cup(0,1)$", ["(-\\infty,-1)\\cup(0,1)"]],
    [
      "$x\\in\\left\\{-\\tfrac12,\\tfrac12\\right\\}$",
      ["-\\frac{1}{2}, \\frac{1}{2}"],
    ],
    ["**a)** $m = 4$ **b)** $x = 1$", ["4", "1"]],
  ])("finds nothing beyond the checks in %s", (answer, expected) => {
    expect(answerAddsText(answer, expected)).toBe(false);
  });

  it.each([
    ["$x = \\frac{\\pi}{2} + k\\pi$, $k \\in \\mathbb{Z}$", ["4"]],
    [
      "$d_1 = 24$, $d_2 = 10$, $P = 120$, $r = \\frac{60}{13}$",
      ["120", "\\frac{60}{13}"],
    ],
    ["Jednačina nema realnih rešenja.", ["0"]],
    ["$D = \\mathbb{R} \\setminus \\{-1\\}$, $f'(x) = 2x$", ["2x"]],
  ])("finds more than the checks in %s", (answer, expected) => {
    expect(answerAddsText(answer, expected)).toBe(true);
  });
});
