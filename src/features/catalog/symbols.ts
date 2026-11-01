const named = (name: string) => ({ label: name, latex: `\\${name}` });

export const answerSymbols = {
  sqrt: { label: "√", latex: "\\sqrt{#0}" },
  "nth-root": { label: "ⁿ√", latex: "\\sqrt[#?]{#0}" },
  pi: { label: "π", latex: "\\pi" },
  e: { label: "e", latex: "e" },
  i: { label: "i", latex: "i" },
  fraction: { label: "a/b", latex: "\\frac{#@}{#?}" },
  power: { label: "xⁿ", latex: "#@^{#?}" },
  factorial: { label: "n!", latex: "!" },
  variations: { label: "Vₙᵏ", latex: "V_{#?}^{#?}" },
  combinations: { label: "Cₙᵏ", latex: "C_{#?}^{#?}" },
  permutations: { label: "Pₙ", latex: "P_{#?}" },
  degree: { label: "°", latex: "#@^{\\circ}" },
  log: { label: "log", latex: "\\log_{#?}{#?}" },
  ln: named("ln"),
  sin: named("sin"),
  cos: named("cos"),
  tg: named("tg"),
  ctg: named("ctg"),
  arcsin: named("arcsin"),
  arccos: named("arccos"),
  arctg: named("arctg"),
};

export type AnswerSymbol = keyof typeof answerSymbols;

export const symbolNames = Object.keys(answerSymbols) as AnswerSymbol[];
