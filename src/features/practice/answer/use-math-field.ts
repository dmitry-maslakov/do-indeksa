import type { MathfieldElement } from "mathlive";
import {
  type RefObject,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { countInput, focused, type InputStats, shown } from "./input-stats";

const keyboardGap = 16;

let setup: Promise<unknown> | undefined;

export const decimalComma = (latex: string) =>
  latex.replace(/(\d)\.(?=\d)/g, "$1{,}");

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

export function useMathField(
  defaultValue: string,
  onEdit: (value: string) => void,
  stats: RefObject<InputStats>,
  fill?: string,
) {
  const field = useRef<MathfieldElement>(null);
  const [value, setValue] = useState(defaultValue);
  const edited = useEffectEvent((latex: string) => {
    setValue(latex);
    onEdit(latex);
  });

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
      const keyboard = window.mathVirtualKeyboard;
      if (
        (event as InputEvent).inputType === "insertLineBreak" &&
        keyboard?.visible
      ) {
        closing = true;
        keyboard.hide();
        closing = false;
        el.blur();
      }
    };
    const reveal = () => {
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
    customElements
      .whenDefined("math-field")
      .then(() =>
        window.mathVirtualKeyboard.addEventListener(
          "virtual-keyboard-toggle",
          toggled,
          { signal },
        ),
      );
    return () => listening.abort();
  }, [stats]);

  useEffect(() => {
    const el = field.current;
    if (!el || fill === undefined) return;
    customElements.whenDefined("math-field").then(() => {
      el.value = decimalComma(fill);
      setValue(el.value);
    });
  }, [fill]);

  return { field, value };
}
