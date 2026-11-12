import { useEffect, useEffectEvent } from "react";
import { isLetter, type OptionLetter } from "@/features/catalog/choice";

const typing =
  "input, textarea, select, math-field, [contenteditable], [role=menu], [role=listbox]";

const dialog = "[role=dialog], [role=alertdialog]";

export function useLetterKeys(
  enabled: boolean,
  letters: OptionLetter[],
  onLetter: (letter: OptionLetter) => void,
) {
  const press = useEffectEvent((event: globalThis.KeyboardEvent) => {
    const letter = event.key.toUpperCase();
    const busy =
      (event.target as Element).closest?.(typing) ||
      document.querySelector(dialog);
    if (event.altKey || event.ctrlKey || event.metaKey || busy) return;
    if (!isLetter(letter) || !letters.includes(letter)) return;
    event.preventDefault();
    onLetter(letter);
  });
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: globalThis.KeyboardEvent) => press(event);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [enabled]);
}
