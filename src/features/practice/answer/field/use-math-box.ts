import type { MathfieldElement } from "mathlive";
import { type RefObject, useEffect, useEffectEvent } from "react";
import { trimComma } from "@/features/catalog/boxes";
import type { Kind } from "@/features/catalog/kinds";
import type { AnswerSymbol } from "@/features/catalog/parts";
import { countInput, focused, type InputStats, shown } from "../input-stats";
import { attachKeys, type BoxKeys } from "./box-keys";
import { keyboardFor } from "./keyboards";

const keyboardGap = 16;

let setup: Promise<unknown> | undefined;
let selected = "";

function publishKeyboardHeight() {
  const keyboard = window.mathVirtualKeyboard;
  const height = keyboard.visible ? keyboard.boundingRect.height : 0;
  document.documentElement.style.setProperty(
    "--keyboard-height",
    `${height}px`,
  );
}

function revealAboveKeyboard() {
  const keyboard = window.mathVirtualKeyboard;
  const active = document.activeElement;
  if (!keyboard?.visible || active?.localName !== "math-field") return;
  const keyboardTop = window.innerHeight - keyboard.boundingRect.height;
  const overlap =
    active.getBoundingClientRect().bottom + keyboardGap - keyboardTop;
  if (overlap > 0) window.scrollBy({ top: overlap, behavior: "smooth" });
}

function submitForm(el: HTMLElement) {
  const form = el.closest("form");
  const button = form?.querySelector<HTMLButtonElement>("button[type=submit]");
  if (form && button && !button.disabled) form.requestSubmit(button);
}

function loadMathlive() {
  setup ??= import("mathlive").then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = "/mathlive-fonts";
    MathfieldElement.soundsDirectory = null;
    MathfieldElement.decimalSeparator = ",";
    for (const event of ["virtual-keyboard-toggle", "geometrychange"])
      window.mathVirtualKeyboard.addEventListener(event, () => {
        publishKeyboardHeight();
        requestAnimationFrame(revealAboveKeyboard);
      });
  });
  return setup;
}

function selectKeyboard(kind: Kind, next: string, symbols: AnswerSymbol[]) {
  const keyboard = window.mathVirtualKeyboard;
  const id = `${kind}/${next}/${symbols.join()}`;
  if (!keyboard || selected === id) return;
  selected = id;
  keyboard.layouts = keyboardFor(kind, next, symbols);
}

interface MathBoxOptions {
  active: RefObject<MathfieldElement | null>;
  value: string;
  keyboard: Kind;
  symbols: AnswerSymbol[];
  next: string;
  keys?: BoxKeys;
  stats: RefObject<InputStats>;
  onEdit: (latex: string) => void;
}

export function useMathBox(
  field: RefObject<MathfieldElement | null>,
  {
    active,
    value,
    keyboard,
    symbols,
    next,
    keys,
    stats,
    onEdit,
  }: MathBoxOptions,
) {
  const boxed = Boolean(keys);
  const edited = useEffectEvent((latex: string) => onEdit(latex));
  const keysNow = useEffectEvent(() => keys);
  const choose = useEffectEvent(() => selectKeyboard(keyboard, next, symbols));

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    loadMathlive();
    shown(stats.current);
    let closing = false;
    const sync = (event: Event) => {
      countInput(stats.current, event as InputEvent);
      if (el.mode === "text") stats.current.text_mode = true;
      edited(el.value);
      if ((event as InputEvent).inputType !== "insertLineBreak") return;
      submitForm(el);
      const vk = window.mathVirtualKeyboard;
      if (vk?.visible) {
        closing = true;
        vk.hide();
        closing = false;
        el.blur();
      }
    };
    const reveal = () => {
      active.current = el;
      choose();
      focused(stats.current);
      requestAnimationFrame(revealAboveKeyboard);
    };
    const toggled = () => {
      if (!closing && el.hasFocus() && !window.mathVirtualKeyboard.visible)
        stats.current.vk_toggles += 1;
    };
    const listening = new AbortController();
    const { signal } = listening;
    el.addEventListener("input", sync, { signal });
    el.addEventListener("focus", reveal, { signal });
    el.addEventListener("pointerdown", () => choose(), {
      capture: true,
      signal,
    });
    customElements.whenDefined("math-field").then(() => {
      window.mathVirtualKeyboard.addEventListener(
        "virtual-keyboard-toggle",
        toggled,
        { signal },
      );
      if (boxed) attachKeys(el, keysNow, signal);
    });
    return () => listening.abort();
  }, [field, active, stats, boxed]);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    customElements.whenDefined("math-field").then(() => {
      if (trimComma(el.value) !== trimComma(value)) el.value = value;
    });
  }, [field, value]);
}
