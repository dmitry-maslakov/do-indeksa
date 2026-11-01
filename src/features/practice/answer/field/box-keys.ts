import type { MathfieldElement } from "mathlive";
import {
  type Bracket,
  noSolution,
  pastedComma,
} from "@/features/catalog/boxes";

export interface BoxKeys {
  next: (carry?: string) => void;
  back: () => void;
  step: (direction: 1 | -1) => boolean;
  bracket?: (bracket: Bracket, text: string) => void;
  union?: () => void;
  none?: () => void;
  paste?: (text: string) => boolean;
}

const digit = /^\d$/;
const modifiers = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);
const brackets = new Set(["(", "[", ")", "]"]);
const plain = /^[^\s;,()[\]U∪]$/;

export function focusBox(box: MathfieldElement) {
  const sink = box.shadowRoot?.querySelector<HTMLElement>(".ML__keyboard-sink");
  if (sink) sink.focus();
  else box.focus();
  box.executeCommand?.("moveToMathfieldEnd");
}

export const typeInto = (box: MathfieldElement, text: string) =>
  box.executeCommand?.([
    "typedText",
    text,
    { simulateKeystroke: true, focus: false, feedback: false },
  ]);

const isBracket = (key: string): key is Bracket => brackets.has(key);

export function attachKeys(
  box: MathfieldElement,
  current: () => BoxKeys | undefined,
  signal: AbortSignal,
) {
  let comma = false;
  let busy = false;
  const previousIsDigit = () =>
    digit.test(box.getValue(box.position - 1, box.position, "latex"));
  const separate = (carry: string) => {
    comma = false;
    busy = true;
    box.executeCommand("deleteBackward");
    busy = false;
    current()?.next(plain.test(carry) ? carry : undefined);
  };
  const pasted = (text: string) => {
    if (current()?.paste?.(text)) return true;
    const latex = pastedComma(text);
    if (latex === text) return false;
    box.insert(latex, { format: "latex" });
    return true;
  };

  box.addEventListener(
    "keydown",
    (event) => {
      const { key } = event;
      const keys = current();
      if (!keys || event.ctrlKey || event.metaKey || event.altKey) return;
      const claim = () => {
        event.preventDefault();
        event.stopPropagation();
      };
      if (comma && key.length === 1 && !digit.test(key)) {
        claim();
        separate(key);
        return;
      }
      if (key.length > 1 && !modifiers.has(key)) comma = false;
      if (keys.bracket && isBracket(key)) {
        claim();
        keys.bracket(key, box.value);
      } else if (keys.union && (key === "U" || key === "∪")) {
        claim();
        keys.union();
      }
    },
    { capture: true, signal },
  );

  box.addEventListener(
    "beforeinput",
    (event) => {
      const keys = current();
      if (busy || !keys) return;
      if (event.inputType === "deleteContentBackward") {
        comma = false;
        if (box.value === "") {
          event.preventDefault();
          keys.back();
        }
        return;
      }
      if (event.inputType !== "insertText") return;
      const data = event.data ?? "";
      const act =
        (isBracket(data) &&
          keys.bracket &&
          (() => keys.bracket?.(data, box.value))) ||
        (data === "\\cup" && keys.union) ||
        (data === noSolution && keys.none);
      if (act) {
        event.preventDefault();
        act();
        return;
      }
      if (comma) {
        if (digit.test(data)) comma = false;
        else {
          event.preventDefault();
          separate(data);
        }
      } else if (data === ";" || data === ",") {
        event.preventDefault();
        keys.next();
      } else if (data === "{,}") {
        if (previousIsDigit()) comma = true;
        else {
          event.preventDefault();
          keys.next();
        }
      }
    },
    { signal },
  );

  box.addEventListener(
    "paste",
    (event) => {
      const text = event.clipboardData?.getData("text/plain");
      if (!text || !pasted(text)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    { capture: true, signal },
  );

  box.addEventListener(
    "move-out",
    (event) => {
      const { direction } = (event as CustomEvent<{ direction: string }>)
        .detail;
      if (direction !== "forward" && direction !== "backward") return;
      if (current()?.step(direction === "forward" ? 1 : -1))
        event.preventDefault();
    },
    { signal },
  );
}
