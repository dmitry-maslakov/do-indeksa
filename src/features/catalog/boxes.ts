import { groupOf, squash, topLevel } from "@/lib/tex";
import { isEmptySet, isInfinite, type Kind, kindOf } from "./kinds";

export type BoxKind = Exclude<Kind, "value" | "choice">;

interface Range {
  open: "(" | "[";
  from: string;
  to: string;
  close: ")" | "]";
}

export type Bracket = Range["open"] | Range["close"];

export type Piece = Range | { point: string };

export type Layout =
  | { kind: "none" }
  | { kind: "values"; boxes: string[] }
  | { kind: "point"; boxes: string[] }
  | { kind: "points"; rows: string[][] }
  | { kind: "interval"; pieces: Piece[] };

export const reasons = [
  "fraction",
  "bracket",
  "end",
  "coordinate",
  "decimal",
  "expression",
] as const;

export type Reason = (typeof reasons)[number];

export interface Problem {
  box: number;
  reason: Reason;
}

interface Shape {
  expected: string;
  kind?: Kind | null;
  var?: string | null;
}

export const noSolution = "\\emptyset";
const pairArity = 2;
const separators = ";,";
const relation =
  /^\s*(?:\([^()=]*\)|(?:\\[A-Za-z]+|[A-Za-z])(?:_\{[^}]*\}|_\w)?)\s*(?:=|\\in(?![a-z]))\s*/;

export const isBoxKind = (kind: Kind | null): kind is BoxKind =>
  kind !== null && kind !== "value" && kind !== "choice";

export const decimalComma = (latex: string) =>
  latex.replace(/(\d)\.(?=\d)/g, "$1{,}");

export const pastedComma = (text: string) =>
  text.replace(/(\d),(?=\d)/g, "$1{,}");

export const trimComma = (latex: string) => latex.replace(/\{,\}$/, "");

export const isFilled = (box: string) =>
  box.replaceAll("\\placeholder{}", "").trim() !== "";

const commaParts = (latex: string) =>
  topLevel(latex.replaceAll("{,}", ";"), ";").map((part) =>
    part.replaceAll(";", "{,}").trim(),
  );

export const hasDecimalComma = (latex: string) => commaParts(latex).length > 1;

export const isRange = (piece: Piece): piece is Range => "from" in piece;

export const isInfiniteEnd = (end: string) => isInfinite(squash(end));

export const boxesOfPiece = (piece: Piece) =>
  isRange(piece) ? [piece.from, piece.to] : [piece.point];

export function groupsOf(layout: Layout): string[][] {
  switch (layout.kind) {
    case "none":
      return [];
    case "values":
      return layout.boxes.map((box) => [box]);
    case "point":
      return [layout.boxes];
    case "points":
      return layout.rows;
    case "interval":
      return layout.pieces.map(boxesOfPiece);
  }
}

export const boxesOf = (layout: Layout) => groupsOf(layout).flat();

export const startOf = (layout: Layout, group: number) =>
  groupsOf(layout).slice(0, group).flat().length;

export function locate(layout: Layout, flat: number) {
  let start = 0;
  const groups = groupsOf(layout);
  for (const [group, boxes] of groups.entries()) {
    if (flat < start + boxes.length)
      return { group, index: flat - start, size: boxes.length };
    start += boxes.length;
  }
  return { group: groups.length, index: 0, size: 0 };
}

const rounded = (piece: Range): Range => ({
  ...piece,
  open: isInfiniteEnd(piece.from) ? "(" : piece.open,
  close: isInfiniteEnd(piece.to) ? ")" : piece.close,
});

export function withBox(layout: Layout, index: number, text: string): Layout {
  let at = -1;
  const set = (box: string) => (++at === index ? text : box);
  switch (layout.kind) {
    case "none":
      return layout;
    case "values":
    case "point":
      return { ...layout, boxes: layout.boxes.map(set) };
    case "points":
      return { ...layout, rows: layout.rows.map((row) => row.map(set)) };
    case "interval":
      return {
        ...layout,
        pieces: layout.pieces.map((piece) =>
          isRange(piece)
            ? rounded({ ...piece, from: set(piece.from), to: set(piece.to) })
            : { point: set(piece.point) },
        ),
      };
  }
}

export function splitAtComma(layout: Layout, flat: number): Layout {
  const { group, index, size } = locate(layout, flat);
  const boxes = groupsOf(layout)[group] ?? [];
  const parts = commaParts(boxes[index] ?? "");
  const fits = parts.length > 1 && parts.length <= size - index;
  if (!fits || !parts.every(isFilled) || boxes.slice(index + 1).some(isFilled))
    return layout;
  return parts.reduce((next, part, i) => withBox(next, flat + i, part), layout);
}

export function withBracket(
  layout: Layout,
  group: number,
  bracket: Bracket,
): Layout {
  if (layout.kind !== "interval") return layout;
  const opening = bracket === "(" || bracket === "[";
  const square = bracket === "[" || bracket === "]";
  return {
    ...layout,
    pieces: layout.pieces.map((piece, i) => {
      if (i !== group || !isRange(piece)) return piece;
      if (square && isInfiniteEnd(opening ? piece.from : piece.to))
        return piece;
      return opening
        ? { ...piece, open: bracket }
        : { ...piece, close: bracket };
    }),
  };
}

export function grown(layout: Layout, arity: number, point = false): Layout {
  switch (layout.kind) {
    case "values":
      return { ...layout, boxes: [...layout.boxes, ""] };
    case "points":
      return { ...layout, rows: [...layout.rows, emptyBoxes(arity)] };
    case "interval":
      return {
        ...layout,
        pieces: [...layout.pieces, point ? { point: "" } : blankRange],
      };
    default:
      return layout;
  }
}

export function shrunk(layout: Layout, group: number): Layout {
  const keep = <T>(list: T[]) =>
    list.length > 1 ? list.filter((_, i) => i !== group) : list;
  switch (layout.kind) {
    case "values":
      return { ...layout, boxes: keep(layout.boxes) };
    case "points":
      return { ...layout, rows: keep(layout.rows) };
    case "interval":
      return { ...layout, pieces: keep(layout.pieces) };
    default:
      return layout;
  }
}

const tuple = (boxes: string[]) => `(${boxes.join(";")})`;

const span = ({ open, from, to, close }: Range) =>
  `${open}${from};${to}${close}`;

export function sentOf(layout: Layout) {
  if (layout.kind === "none") return noSolution;
  if (!boxesOf(layout).some(isFilled)) return "";
  switch (layout.kind) {
    case "values":
      return layout.boxes.join(";");
    case "point":
      return tuple(layout.boxes);
    case "points":
      return layout.rows.map(tuple).join(";");
    case "interval":
      return layout.pieces
        .map((piece) => (isRange(piece) ? span(piece) : `\\{${piece.point}\\}`))
        .join("\\cup");
  }
}

const emptyBoxes = (size: number) => Array.from({ length: size }, () => "");

const blankRange: Range = { open: "(", from: "", to: "", close: ")" };

export function blankLayout(kind: BoxKind, arity: number): Layout {
  switch (kind) {
    case "values":
      return { kind, boxes: [""] };
    case "point":
      return { kind, boxes: emptyBoxes(arity) };
    case "points":
      return { kind, rows: [emptyBoxes(arity)] };
    case "interval":
      return { kind, pieces: [blankRange] };
  }
}

const tidy = (latex: string) =>
  latex
    .replace(/\\left|\\right/g, "")
    .replace(/\\[ ,;!]/g, " ")
    .replaceAll("\\lbrack", "[")
    .replaceAll("\\rbrack", "]")
    .replaceAll("\\lbrace", "\\{")
    .replaceAll("\\rbrace", "\\}")
    .trim();

const unbrace = (latex: string) => /^\\\{(.*)\\\}$/s.exec(latex)?.[1] ?? latex;

const trimmed = (items: string[]) => items.map((item) => item.trim());

const spread = (items: string[]) =>
  items.length === 1 ? commaParts(items[0] ?? "") : trimmed(items);

function plusMinus(item: string) {
  const rest = /^\\pm\s*(.+)$/.exec(item)?.[1];
  return rest ? [rest, `-(${rest})`] : [item];
}

function tupleOf(latex: string) {
  const group = groupOf(latex, separators);
  return spread(group ? group.items : topLevel(latex, separators));
}

function piecesOf(latex: string): Piece[] | null {
  const pieces: Piece[] = [];
  for (const source of topLevel(latex.replaceAll("\\cup", ";"), ";")) {
    const piece = source.trim();
    if (piece.startsWith("\\{")) {
      const points = topLevel(unbrace(piece), separators);
      pieces.push(...trimmed(points).map((point) => ({ point })));
      continue;
    }
    const group = groupOf(piece, separators);
    const ends = spread(group?.items ?? []);
    if (!group || ends.length !== 2) return null;
    const [from = "", to = ""] = ends;
    pieces.push({
      open: group.open === "[" ? "[" : "(",
      from,
      to,
      close: group.close === "]" ? "]" : ")",
    });
  }
  return pieces;
}

export function layoutOf(kind: BoxKind, text: string): Layout | null {
  const latex = tidy(text).replace(relation, "").trim();
  if (isEmptySet(squash(latex))) {
    return kind === "values" || kind === "interval" ? { kind: "none" } : null;
  }
  switch (kind) {
    case "values":
      return {
        kind,
        boxes: trimmed(topLevel(unbrace(latex), separators)).flatMap(plusMinus),
      };
    case "point":
      return { kind, boxes: tupleOf(latex) };
    case "points":
      return {
        kind,
        rows: topLevel(latex, separators).map((row) => tupleOf(row.trim())),
      };
    case "interval": {
      const pieces = piecesOf(latex);
      return pieces && { kind, pieces };
    }
  }
}

export function pastedLayout(kind: BoxKind, text: string, arity: number) {
  const layout = layoutOf(
    kind,
    (kind === "values" ? pastedComma(text) : text)
      .replaceAll("∞", "\\infty")
      .replaceAll("∪", "\\cup")
      .replaceAll("−", "-"),
  );
  if (!layout || boxesOf(layout).length < 2) return null;
  const sized =
    kind === "values" ||
    kind === "interval" ||
    groupsOf(layout).every((boxes) => boxes.length === arity);
  return sized ? layout : null;
}

export function filledCount(kind: Kind | null, text: string) {
  const layout = isBoxKind(kind) ? layoutOf(kind, text) : null;
  return layout
    ? boxesOf(layout).filter(isFilled).length
    : Number(isFilled(text));
}

export function arityOf(part: Shape) {
  const declared = part.var && groupOf(squash(part.var))?.items.length;
  if (declared) return declared;
  const kind = kindOf(part);
  const layout = isBoxKind(kind) ? layoutOf(kind, part.expected) : null;
  if (layout?.kind !== "point" && layout?.kind !== "points") return pairArity;
  return groupsOf(layout)[0]?.length ?? pairArity;
}

export function sentForm(part: Shape) {
  const kind = kindOf(part);
  if (!isBoxKind(kind)) return decimalComma(part.expected);
  const layout = layoutOf(kind, decimalComma(part.expected));
  return layout && sentOf(layout);
}
