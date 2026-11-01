import {
  type BoxedExpression,
  ComputeEngine,
  isFunction,
  isSymbol,
} from "@cortex-js/compute-engine";
import type { PartOutcome } from "@/db/columns";
import {
  type BoxKind,
  boxesOf,
  boxesOfPiece,
  groupsOf,
  hasDecimalComma,
  isBoxKind,
  isFilled,
  isRange,
  type Layout,
  layoutOf,
  type Piece,
  type Problem,
  type Reason,
  sentForm,
  sentOf,
} from "./boxes";
import { type Kind, kindOf } from "./kinds";

const ce = new ComputeEngine();

export interface GradedPart {
  expected: string;
  kind?: Kind | null;
  unit?: string | null;
}

interface Graded {
  outcome: PartOutcome;
  problem?: Problem;
}

export function parseMath(latex: string): BoxedExpression {
  const expr = ce.parse(latex.replaceAll("{,}", "."));
  return isFunction(expr) &&
    ["Equal", "Element"].includes(expr.operator) &&
    isSymbol(expr.op1)
    ? expr.op2
    : expr;
}

const isOrdered = (latex: string) =>
  /^\s*(\\left)?\(/.test(latex) && !latex.includes("\\cup");

const isReadable = (latex: string) =>
  !latex.includes("\\placeholder") && parseMath(latex).isValid;

const items = (expr: BoxedExpression) =>
  isFunction(expr) && ["Tuple", "Set", "Union"].includes(expr.operator)
    ? [...expr.ops]
    : [expr];

const equal = (a: BoxedExpression, b: BoxedExpression) => a.isEqual(b) === true;

function sameItems(expected: BoxedExpression[], given: BoxedExpression[]) {
  const left = [...given];
  for (const e of expected) {
    const i = left.findIndex((g) => equal(e, g));
    if (i === -1) return false;
    left.splice(i, 1);
  }
  return left.length === 0;
}

const readings = (latex: string) =>
  latex.includes("{,}") ? [latex, latex.replaceAll("{,}", ",")] : [latex];

function matches(input: string, expected: string, target: BoxedExpression) {
  const given = parseMath(input);
  if (!given.isValid) return false;
  if (isOrdered(expected)) return equal(given, target);
  const candidates =
    expected.includes("\\circ") && !input.includes("\\circ")
      ? [given, parseMath(`${input}^\\circ`)]
      : [given];
  return candidates.some((c) => sameItems(items(target), items(c)));
}

function reasonOf(box: string): Reason {
  if (/\\placeholder|\{\}/.test(box)) return "fraction";
  const opened = box.match(/[([]/g)?.length ?? 0;
  const closed = box.match(/[)\]]/g)?.length ?? 0;
  return /\\right\?/.test(box) || opened !== closed ? "bracket" : "expression";
}

function gradeSingle(input: string, expected: string): Graded {
  const given = readings(input);
  if (!given.some(isReadable))
    return {
      outcome: "unreadable",
      problem: { box: 0, reason: reasonOf(input) },
    };
  const target = parseMath(expected);
  return {
    outcome: given.some((reading) => matches(reading, expected, target))
      ? "right"
      : "wrong",
  };
}

const sameSet = <T>(a: T[], b: T[], same: (x: T, y: T) => boolean) =>
  a.every((x) => b.some((y) => same(x, y))) &&
  b.every((y) => a.some((x) => same(x, y)));

const sameList = <T>(a: T[], b: T[], same: (x: T, y: T) => boolean) =>
  a.length === b.length &&
  a.every((x, i) => b[i] !== undefined && same(x, b[i]));

const sameTuple = (a: BoxedExpression[], b: BoxedExpression[]) =>
  sameList(a, b, equal);

const parsed = (boxes: string[]) => boxes.filter(isFilled).map(parseMath);

const usedGroups = (layout: Layout) =>
  groupsOf(layout).filter((group) => group.some(isFilled));

interface Span {
  from: BoxedExpression;
  to: BoxedExpression;
  closedFrom: boolean;
  closedTo: boolean;
}

function real(expr: BoxedExpression) {
  const value = expr.N();
  return value.im === 0 ? value.re : Number.NaN;
}

const isBounded = (expr: BoxedExpression) => Math.abs(real(expr)) !== Infinity;

function order(a: BoxedExpression, b: BoxedExpression) {
  const [x, y] = [real(a), real(b)];
  return x === y || equal(a, b) ? 0 : Math.sign(x - y);
}

function spanOf(piece: Piece): Span {
  if (!isRange(piece)) {
    const point = parseMath(piece.point);
    return { from: point, to: point, closedFrom: true, closedTo: true };
  }
  const [from, to] = [parseMath(piece.from), parseMath(piece.to)];
  return {
    from,
    to,
    closedFrom: piece.open === "[" && isBounded(from),
    closedTo: piece.close === "]" && isBounded(to),
  };
}

const isEmptySpan = ({ from, to, closedFrom, closedTo }: Span) => {
  const side = order(from, to);
  return side > 0 || (side === 0 && !(closedFrom && closedTo));
};

const touches = (last: Span, span: Span) => {
  const gap = order(span.from, last.to);
  return gap < 0 || (gap === 0 && (last.closedTo || span.closedFrom));
};

function merged(pieces: Piece[]) {
  const spans = pieces
    .filter((piece) => boxesOfPiece(piece).some(isFilled))
    .map(spanOf)
    .filter((span) => !isEmptySpan(span))
    .sort(
      (a, b) =>
        order(a.from, b.from) || Number(b.closedFrom) - Number(a.closedFrom),
    );
  const joined: Span[] = [];
  for (const span of spans) {
    const last = joined.at(-1);
    if (!last || !touches(last, span)) {
      joined.push(span);
      continue;
    }
    const longer = order(span.to, last.to);
    if (longer > 0)
      Object.assign(last, { to: span.to, closedTo: span.closedTo });
    else if (longer === 0) last.closedTo = last.closedTo || span.closedTo;
  }
  return joined;
}

const sameSpan = (a: Span, b: Span) =>
  order(a.from, b.from) === 0 &&
  order(a.to, b.to) === 0 &&
  a.closedFrom === b.closedFrom &&
  a.closedTo === b.closedTo;

function sameLayout(a: Layout, b: Layout) {
  if (a.kind === "none" || b.kind === "none") return a.kind === b.kind;
  if (a.kind === "values" && b.kind === "values")
    return sameSet(parsed(a.boxes), parsed(b.boxes), equal);
  if (a.kind === "point" && b.kind === "point")
    return sameTuple(a.boxes.map(parseMath), b.boxes.map(parseMath));
  if (a.kind === "points" && b.kind === "points")
    return sameSet(
      usedGroups(a).map((row) => row.map(parseMath)),
      usedGroups(b).map((row) => row.map(parseMath)),
      sameTuple,
    );
  if (a.kind === "interval" && b.kind === "interval")
    return sameList(merged(a.pieces), merged(b.pieces), sameSpan);
  return false;
}

function problemOf(layout: Layout): Problem | undefined {
  const needed = layout.kind !== "values";
  const blank = layout.kind === "interval" ? "end" : "coordinate";
  let start = 0;
  for (const group of groupsOf(layout)) {
    const used = group.some(isFilled);
    for (const [i, text] of group.entries()) {
      if (!isFilled(text)) {
        if (!needed || !used) continue;
        const decimal = group.findIndex(hasDecimalComma);
        return decimal === -1
          ? { box: start + i, reason: blank }
          : { box: start + decimal, reason: "decimal" };
      }
      if (!isReadable(text)) return { box: start + i, reason: reasonOf(text) };
    }
    start += group.length;
  }
}

const withoutUnit = (input: string, unit?: string | null) =>
  unit ? input.replaceAll(unit, "") : input;

function gradeBoxes(part: GradedPart, kind: BoxKind, text: string): Graded {
  const layout = layoutOf(kind, text);
  if (!layout)
    return {
      outcome: "unreadable",
      problem: { box: 0, reason: "expression" },
    };
  if (layout.kind !== "none" && !boxesOf(layout).some(isFilled))
    return { outcome: "empty" };
  const problem = problemOf(layout);
  if (problem) return { outcome: "unreadable", problem };
  const target = layoutOf(kind, part.expected);
  return {
    outcome: target && sameLayout(target, layout) ? "right" : "wrong",
  };
}

function gradePart(part: GradedPart, answer: string): Graded {
  const input = withoutUnit(answer, part.unit);
  if (!isFilled(input)) return { outcome: "empty" };
  const kind = kindOf(part);
  return isBoxKind(kind)
    ? gradeBoxes(part, kind, input)
    : gradeSingle(input, part.expected);
}

export const checkerVersion = 5;

export const gradeParts = (parts: GradedPart[], answers: string[]) =>
  parts.map((part, i) => gradePart(part, answers[i] ?? ""));

export function answerProblem(part: GradedPart) {
  const sent = sentForm(part);
  const kind = kindOf(part);
  if (sent === null) return `cannot be laid out as kind "${kind}"`;
  const { outcome } = gradePart(part, sent);
  if (outcome !== "right")
    return `is graded "${outcome}" when sent as "${sent}"`;
  const layout = isBoxKind(kind) && layoutOf(kind, sent);
  if (layout && sentOf(layout) !== sent)
    return `is not kept by its boxes: sent as "${sent}", read back as "${sentOf(layout)}"`;
}
