import { sumBy } from "es-toolkit";
import type { VirtualKeyboardKeycap, VirtualKeyboardLayout } from "mathlive";
import { noSolution } from "@/features/catalog/boxes";
import type { Kind } from "@/features/catalog/kinds";
import { type AnswerSymbol, answerSymbols } from "@/features/catalog/symbols";

type Keycap = Partial<VirtualKeyboardKeycap>;

type Key = string | Keycap;

type Row = Key[];

const action = "MLK__keycap action";

const rowWidth = 10;

function symbolKey(
  name: AnswerSymbol,
): Keycap & Pick<VirtualKeyboardKeycap, "width"> {
  const { label, latex } = answerSymbols[name];
  return {
    label,
    insert: latex,
    width: label.length > 3 ? 1.5 : 1,
    ...(/^[a-z]{2,}$/.test(label) && { class: "small" }),
  };
}

function symbolRows(symbols: AnswerSymbol[]): Row[] {
  const keys = symbols.map(symbolKey);
  const total = sumBy(keys, (key) => key.width);
  const share = total / Math.ceil(total / rowWidth);
  const rows: Row[] = [];
  let start = 0;
  for (const key of keys) {
    const row = Math.floor((start + key.width / 2) / share);
    rows[row] = [...(rows[row] ?? []), key];
    start += key.width;
  }
  return rows;
}

const digits: Row[] = [
  ["[7]", "[8]", "[9]", { label: "÷", latex: "\\div" }, "[left]"],
  ["[4]", "[5]", "[6]", { label: "×", latex: "\\times" }, "[right]"],
  ["[1]", "[2]", "[3]", "[-]", "[+]"],
  [
    {
      label: "abc",
      class: action,
      command: ["switchKeyboardLayer", "letters"],
    },
    "[0]",
    "[,]",
    { label: "[backspace]", width: 2 },
  ],
];

const operators: Row = [
  "[+]",
  "[-]",
  symbolKey("sqrt"),
  symbolKey("fraction"),
  symbolKey("power"),
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
  { label: "−∞", latex: "-\\infty" },
  { label: "+∞", latex: "+\\infty" },
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

const top = (kind: Kind, label: string): Row | undefined => {
  switch (kind) {
    case "values":
      return [
        next(label),
        { label: "∅", latex: noSolution, class: `${action} w20` },
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
  kind: Kind,
  label: string,
  symbols: AnswerSymbol[],
): VirtualKeyboardLayout {
  const first = top(kind, label);
  const withTop = (rows: Row[]) => (first ? [first, ...rows] : rows);
  return {
    id: kind,
    displayEditToolbar: false,
    layers: [
      { id: "digits", rows: withTop([...symbolRows(symbols), ...digits]) },
      { id: "letters", rows: withTop(letters) },
    ],
  };
}
