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

const letters: Row[] = [
  "qwertyuiop".split("").map((label) => ({ label })),
  "asdfghjkl".split("").map((label) => ({ label })),
  "zxcvbnm".split("").map((label) => ({ label })),
  [
    { label: "123", class: action, command: ["switchKeyboardLayer", "digits"] },
    "[(]",
    "[)]",
    "[left]",
    "[right]",
    "[backspace]",
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
      return brackets;
    default:
      return undefined;
  }
};

export function keyboardFor(
  kind: KeyboardKind,
  label: string,
): VirtualKeyboardLayout {
  const first = top(kind, label);
  return {
    id: kind,
    displayEditToolbar: false,
    layers: [
      { id: "digits", rows: first ? [first, ...digits] : digits },
      { id: "letters", rows: letters },
    ],
  };
}
