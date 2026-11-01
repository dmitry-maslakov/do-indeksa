import { compact, uniq } from "es-toolkit";
import { z } from "zod";
import { squash, topLevel } from "@/lib/tex";
import { inferKind, type Kind, kindProblem, kinds } from "./kinds";

export const maxParts = 6;

export interface PartMarkup {
  expected: string;
  label: string | null;
  part: string | null;
  var: string | null;
  kind: Kind | null;
  unit: string | null;
}

export interface PartLabel {
  letter: string;
  prefix: string | null;
  suffix: string | null;
  caption: string | null;
}

export const hasBareTex = (label: string) =>
  /[\^_\\{}]/.test(label.replace(/\$+[^$]*\$+/g, ""));

const tex = z
  .string()
  .min(1)
  .refine((source) => !source.includes("$"), "TeX without $…$");

export const partSchema = z.object({
  part: z
    .string()
    .regex(/^[a-zđ]$/u, "a single lowercase letter")
    .optional(),
  var: tex.optional(),
  kind: z.enum(kinds).optional(),
  unit: tex.optional(),
  label: z
    .string()
    .refine((label) => !hasBareTex(label), "TeX outside $…$")
    .optional(),
  expected: z.string().min(1),
});

const lettered = /^([a-zđ]\))\s*(.*)$/u;

export const statementLetters = (text: string) =>
  uniq(Array.from(text.matchAll(/\*\*([a-zđ]\))\*\*/gu), (m) => m[1] ?? ""));

function symbolOf(rest: string) {
  const bare = rest.replace(/\s*=\s*$/, "");
  const short = rest.length <= 8 && !/\s/.test(bare);
  const equation = /=\s*$/.test(rest) && rest.length <= 18;
  return rest && (short || equation) ? bare : null;
}

const capital = /^\$?[A-Z](?:\([^)]*\)|_\{?\w+\}?)?\$?$/;

const math = (tex: string) => (tex ? `$${tex}$` : null);

function frame(kind: Kind | null, symbol: string | null, unit: string | null) {
  const braced = kind === "values" || kind === "points";
  const relation =
    braced || (kind === "interval" && !capital.test(symbol ?? ""))
      ? "\\in"
      : "=";
  return {
    prefix: symbol
      ? `${symbol} ${math(braced ? `${relation}\\{` : relation)}`
      : math(braced ? "\\{" : ""),
    suffix: math(compact([braced && "\\}", unit]).join("\\,")),
  };
}

export function labelOf(
  markup: PartMarkup,
  index: number,
  count: number,
): PartLabel {
  const { label, part, var: variable, unit } = markup;
  const kind = markup.kind ?? inferKind(markup.expected);
  const match = lettered.exec(label ?? "");
  const rest = (match ? (match[2] ?? "") : (label ?? "")).trim();
  const fallback = count > 1 ? `${index + 1}.` : "";
  const symbol = variable ? `$${variable}$` : symbolOf(rest);
  return {
    letter: part ? `${part})` : (match?.[1] ?? fallback),
    caption: rest && (variable || !symbol) ? rest : null,
    ...frame(kind, symbol, unit),
  };
}

export function resultOf(parts: PartMarkup[]) {
  return parts
    .map((markup, i, all) => {
      const { letter, caption, prefix, suffix } = labelOf(
        markup,
        i,
        all.length,
      );
      return compact([
        letter && `**${letter}**`,
        caption,
        prefix,
        `$${markup.expected}$`,
        suffix,
      ]).join(" ");
    })
    .join("\n\n");
}

export function partProblem(markup: PartMarkup, letters: string[]) {
  const { part, kind, expected, var: variable } = markup;
  if (part && !letters.includes(`${part})`)) {
    return `the statement has no part "${part})", it has ${letters.join(" ") || "no lettered parts"}`;
  }
  return kindProblem(kind, expected, variable);
}

const maths = (text: string) => text.match(/\$\$?[^$]+\$\$?/g) ?? [];

const valuesOf = (math: string) =>
  topLevel(squash(math)).flatMap((part) =>
    topLevel(
      (part.split(/=|\\in(?![a-z])/).at(-1) ?? part).replace(
        /^\\\{(.*)\\\}$/,
        "$1",
      ),
    ),
  );

export function answerAddsText(answer: string, expected: string[]) {
  const words = answer
    .replace(/\$[^$]*\$/g, "")
    .replace(/\b(ili|tj|odnosno)\b/gi, "");
  if (/\p{L}{5,}/u.test(words)) return true;
  if (/\\mathbb|[kn]\s*\\in/.test(answer)) return true;
  const items = new Set(expected.flatMap((e) => topLevel(squash(e))));
  return maths(answer).some((math) =>
    valuesOf(math).some((value) => !items.has(value)),
  );
}

export function uncheckedLetters(text: string, parts: PartLabel[]) {
  const checked = new Set(parts.map((p) => p.letter));
  return statementLetters(text).filter((letter) => !checked.has(letter));
}
