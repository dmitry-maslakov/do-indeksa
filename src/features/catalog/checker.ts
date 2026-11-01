import {
  type BoxedExpression,
  ComputeEngine,
  isFunction,
  isSymbol,
} from "@cortex-js/compute-engine";
import type { PartOutcome } from "@/db/columns";

const ce = new ComputeEngine();

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

export function isEquivalent(input: string, expected: string): boolean {
  const target = parseMath(expected);
  return readings(input).some((reading) => matches(reading, expected, target));
}

const isBlank = (input: string) =>
  input.replaceAll("\\placeholder{}", "").trim() === "";

function gradePart(input: string, expected: string): PartOutcome {
  if (isBlank(input)) return "empty";
  if (!readings(input).some((reading) => parseMath(reading).isValid))
    return "unreadable";
  return isEquivalent(input, expected) ? "right" : "wrong";
}

export const checkerVersion = 3;

export const gradeParts = (expected: string[], answers: string[]) =>
  expected.map((e, i) => gradePart(answers[i] ?? "", e));
