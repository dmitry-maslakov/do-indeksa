import {
  type BoxedExpression,
  ComputeEngine,
  isFunction,
  isSymbol,
} from "@cortex-js/compute-engine";

const ce = new ComputeEngine();

export function parseMath(latex: string): BoxedExpression {
  const expr = ce.parse(latex.replaceAll("{,}", "."));
  return isFunction(expr) && expr.operator === "Equal" && isSymbol(expr.op1)
    ? expr.op2
    : expr;
}

const isOrdered = (latex: string) => /^\s*(\\left)?\(/.test(latex);

const items = (expr: BoxedExpression) =>
  isFunction(expr) && (expr.operator === "Tuple" || expr.operator === "Set")
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

export function isEquivalent(input: string, expected: string): boolean {
  const given = parseMath(input);
  const target = parseMath(expected);
  if (!given.isValid) return false;
  if (isOrdered(expected)) return equal(given, target);
  const candidates =
    expected.includes("\\circ") && !input.includes("\\circ")
      ? [given, parseMath(`${input}^\\circ`)]
      : [given];
  return candidates.some((c) => sameItems(items(target), items(c)));
}
