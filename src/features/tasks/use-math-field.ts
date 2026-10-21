import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";

const keyboardGap = 16;

let setup: Promise<unknown> | undefined;

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
) {
  const field = useRef<MathfieldElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    loadMathlive();
    const el = field.current;
    if (!el) return;
    const sync = (event: Event) => {
      setValue(el.value);
      onEdit(el.value);
      const keyboard = window.mathVirtualKeyboard;
      if (
        (event as InputEvent).inputType === "insertLineBreak" &&
        keyboard?.visible
      ) {
        keyboard.hide();
        el.blur();
      }
    };
    const reveal = () => requestAnimationFrame(revealAboveKeyboard);
    el.addEventListener("input", sync);
    el.addEventListener("focus", reveal);
    return () => {
      el.removeEventListener("input", sync);
      el.removeEventListener("focus", reveal);
    };
  }, [onEdit]);

  return { field, value };
}
