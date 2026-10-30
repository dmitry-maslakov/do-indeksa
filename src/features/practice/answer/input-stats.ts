import type { RefObject } from "react";
import { secondMs } from "@/lib/dates";

export interface InputStats {
  shownAt?: number;
  focusAt?: number;
  editAt?: number;
  editMs: number;
  field_ready_ms?: number;
  inputs: number;
  deletes: number;
  pastes: number;
  vk_inputs: number;
  vk_toggles: number;
  text_mode: boolean;
}

export const structureKinds = [
  "frac",
  "sqrt",
  "pow",
  "text",
  "paren",
  "set",
  "interval",
] as const;

type StructureKind = (typeof structureKinds)[number];

const marks: Partial<Record<StructureKind, RegExp>> = {
  frac: /\\[cdt]?frac(?![a-z])/,
  sqrt: /\\sqrt(?![a-z])/,
  pow: /\^/,
  text: /\\text\{/,
};

function fenceKinds(latex: string) {
  const opened: string[] = [];
  const interval = /\\infty|\\cup/.test(latex);
  return Array.from(latex.matchAll(/\\(left|right)(\\[a-z]+|.)/g)).flatMap(
    ([, side, delimiter = ""]): StructureKind[] => {
      if (side === "left") {
        opened.push(delimiter);
        return [];
      }
      const pair = `${opened.pop() ?? ""}${delimiter}`;
      if (pair.includes("brace")) return ["set"];
      if (pair.includes("brack")) return ["interval"];
      if (pair !== "()") return [];
      return [interval ? "interval" : "paren"];
    },
  );
}

const editIdleMs = 10 * secondMs;

export const freshInput = (): InputStats => ({
  editMs: 0,
  inputs: 0,
  deletes: 0,
  pastes: 0,
  vk_inputs: 0,
  vk_toggles: 0,
  text_mode: false,
});

export function whenFieldReady(ready: (ms: number) => void) {
  if (customElements.get("math-field")) return;
  const start = performance.now();
  customElements
    .whenDefined("math-field")
    .then(() => ready(Math.round(performance.now() - start)));
}

export function shown(input: InputStats) {
  if (input.focusAt !== undefined) return;
  input.shownAt = performance.now();
  whenFieldReady((ms) => {
    input.field_ready_ms ??= ms;
  });
}

export function focused(input: InputStats) {
  input.focusAt ??= performance.now();
}

export function countInput(
  input: InputStats,
  { inputType, data, isComposing }: InputEvent,
) {
  if (isComposing || inputType === "insertCompositionText") return;
  const type = inputType || data || "";
  const now = performance.now();
  focused(input);
  if (input.editAt !== undefined)
    input.editMs += Math.min(now - input.editAt, editIdleMs);
  input.editAt = now;
  input.inputs += 1;
  if (type.startsWith("delete")) input.deletes += 1;
  if (type === "insertFromPaste") input.pastes += 1;
  if (window.mathVirtualKeyboard?.visible) input.vk_inputs += 1;
}

const between = (from?: number, to?: number) =>
  from === undefined || to === undefined ? undefined : Math.round(to - from);

export function takeInput(input: RefObject<InputStats>) {
  const { shownAt, focusAt, editAt, editMs, ...counts } = input.current;
  input.current = freshInput();
  return {
    ...counts,
    first_focus_ms: between(shownAt, focusAt),
    focus_to_submit_ms: between(focusAt, performance.now()),
    edit_ms: Math.round(editMs),
  };
}

export function latexStats(values: string[]) {
  const latex = values.join("");
  const fences = fenceKinds(latex);
  const structures = structureKinds.filter(
    (kind) => marks[kind]?.test(latex) || fences.includes(kind),
  );
  return {
    latex_len: latex.length,
    structures: structures.length ? structures : undefined,
  };
}
