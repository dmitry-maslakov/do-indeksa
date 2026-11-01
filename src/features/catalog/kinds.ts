import { groupOf, squash, topLevel } from "@/lib/tex";

export const kinds = [
  "value",
  "values",
  "interval",
  "point",
  "points",
] as const;

export type Kind = (typeof kinds)[number];

type Group = NonNullable<ReturnType<typeof groupOf>>;

export const isEmptySet = (latex: string) =>
  latex === "\\emptyset" || latex === "\\varnothing";

export const isInfinite = (item: string) => /^[+-]?\\infty$/.test(item);

const isSpan = (group: Group | null) =>
  group?.items.length === 2 &&
  (group.open === "[" || group.close === "]" || group.items.some(isInfinite));

export function inferKind(expected: string): Kind | null {
  const latex = squash(expected);
  const groups = topLevel(latex).map((item) => groupOf(item));
  if (/\\cup|\\\{/.test(latex) || groups.some(isSpan)) return "interval";
  if (groups.length > 1) {
    return groups.every((group) => group && group.items.length > 1)
      ? "points"
      : "values";
  }
  const size = groups[0]?.items.length ?? 1;
  if (size > 2) return "point";
  return size === 2 || isEmptySet(latex) ? null : "value";
}

export const kindOf = (part: { expected: string; kind?: Kind | null }) =>
  part.kind ?? inferKind(part.expected);

const fitting: Record<Kind, readonly Kind[]> = {
  value: ["value", "values"],
  values: ["values"],
  interval: ["interval"],
  point: ["point", "points"],
  points: ["points"],
};

function fittingKinds(expected: string): readonly Kind[] {
  const inferred = inferKind(expected);
  if (inferred) return fitting[inferred];
  return isEmptySet(squash(expected))
    ? ["values", "interval"]
    : ["interval", "point", "points"];
}

function isInterval(piece: string) {
  if (/^\\\{.+\\\}$/.test(piece)) return true;
  const group = groupOf(piece);
  if (group?.items.length !== 2) return false;
  const [from = "", to = ""] = group.items;
  return (
    (!isInfinite(from) || group.open === "(") &&
    (!isInfinite(to) || group.close === ")")
  );
}

function intervalProblem(latex: string) {
  if (isEmptySet(latex)) return;
  const bad = latex.split("\\cup").find((piece) => !isInterval(piece));
  if (bad !== undefined) {
    return `"${bad}" is neither an interval nor a set of points`;
  }
}

function arityProblem(latex: string, variable: string | null) {
  const size = variable && groupOf(squash(variable))?.items.length;
  if (!size) return;
  const bad = topLevel(latex).find(
    (item) => groupOf(item)?.items.length !== size,
  );
  if (bad !== undefined) {
    return `"${bad}" does not have the ${size} components of var "${variable}"`;
  }
}

export function kindProblem(
  kind: Kind | null,
  expected: string,
  variable: string | null,
) {
  const fits = fittingKinds(expected);
  if (kind && !fits.includes(kind)) {
    return `kind "${kind}" does not fit expected "${expected}" (fits: ${fits.join(", ")})`;
  }
  const latex = squash(expected);
  if (kind === "interval") return intervalProblem(latex);
  const read = kind ?? inferKind(expected);
  const tuples =
    read === "point" ||
    read === "points" ||
    (read === null && !isEmptySet(latex));
  if (tuples) return arityProblem(latex, variable);
}
