import type { VirtualKeyboardKeycap, VirtualKeyboardLayout } from "mathlive";
import type { Kind } from "@/features/catalog/kinds";

export type KeyboardKind = Kind | "none";

type Key = string | Partial<VirtualKeyboardKeycap>;

type Row = Key[];

const action = "MLK__keycap action";

const digits: Row[] = [
  [
    "[7]",
    "[8]",
    "[9]",
    { label: "÷", latex: "\\div" },
    { label: "√", insert: "\\sqrt{#0}" },
    { label: "π", latex: "\\pi" },
  ],
  [
    "[4]",
    "[5]",
    "[6]",
    { label: "×", latex: "\\times" },
    { label: "a/b", insert: "\\frac{#@}{#?}" },
    { label: "xⁿ", insert: "#@^{#?}" },
  ],
  ["[1]", "[2]", "[3]", "[-]", "[left]", "[right]"],
  [
    {
      label: "abc",
      class: action,
      command: ["switchKeyboardLayer", "letters"],
    },
    "[0]",
    "[,]",
    "[+]",
    { label: "[backspace]", width: 2 },
  ],
];

const operators: Row = [
  "[+]",
  "[-]",
  { label: "√", insert: "\\sqrt{#0}" },
  { label: "a/b", insert: "\\frac{#@}{#?}" },
  { label: "xⁿ", insert: "#@^{#?}" },
  "[(]",
  "[)]",
  "[,]",
  "[left]",
  "[right]",
];

const letters: Row[] = [
  operators,
  "qwertyuiop".split("").map((label) => ({ label })),
  "asdfghjkl".split("").map((label) => ({ label })),
  [
    {
      label: "123",
      class: action,
      width: 1.5,
      command: ["switchKeyboardLayer", "digits"],
    },
    ..."zxcvbnm".split("").map((label) => ({ label })),
    { label: "[backspace]", width: 1.5 },
  ],
];

const brackets: Row = [
  { label: "(", insert: "(" },
  { label: "[", insert: "[" },
  { label: "]", insert: "]" },
  { label: ")", insert: ")" },
  { label: "∞", latex: "\\infty" },
  { label: "∪", insert: "\\cup" },
];

const nextEnd: Key = {
  label: "⇥",
  insert: ";",
  class: `${action} small`,
  width: 1.5,
};

const next = (label: string): Key => ({
  label: `${label} ⇥`,
  insert: ";",
  class: `${action} w20 small`,
});

const top = (kind: KeyboardKind, label: string): Row | undefined => {
  switch (kind) {
    case "values":
      return [
        next(label),
        { label: "∅", latex: "\\emptyset", class: `${action} w20` },
        { label: "i", latex: "i", class: `${action} w20` },
      ];
    case "point":
    case "points":
      return [next(label)];
    case "interval":
      return [...brackets, nextEnd];
    default:
      return undefined;
  }
};

export function keyboardFor(
  kind: KeyboardKind,
  label: string,
): VirtualKeyboardLayout {
  const first = top(kind, label);
  const withTop = (rows: Row[]) => (first ? [first, ...rows] : rows);
  return {
    id: kind,
    displayEditToolbar: false,
    layers: [
      { id: "digits", rows: withTop(digits) },
      { id: "letters", rows: withTop(letters) },
    ],
  };
}
