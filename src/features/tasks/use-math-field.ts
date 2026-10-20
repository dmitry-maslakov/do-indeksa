import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";

let setup: Promise<unknown> | undefined;

function loadMathlive() {
  setup ??= import("mathlive").then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = "/mathlive-fonts";
    MathfieldElement.soundsDirectory = null;
    MathfieldElement.decimalSeparator = ",";
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
    el.mathVirtualKeyboardPolicy = "manual";
    const sync = () => {
      setValue(el.value);
      onEdit(el.value);
    };
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [onEdit]);

  return { field, value };
}
