import type { MathfieldElement } from "mathlive";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  type BoxKind,
  blankLayout,
  boxesOf,
  grown,
  type Layout,
  layoutOf,
  pastedLayout,
  sentOf,
  trimComma,
  withBox,
} from "@/features/catalog/boxes";
import { focusBox, typeInto } from "./box-keys";

interface BoxLayoutOptions {
  kind: BoxKind;
  arity: number;
  defaultValue: string;
  fill?: string;
  locked: boolean;
  onEdit: (sent: string) => void;
}

export function useBoxLayout({
  kind,
  arity,
  defaultValue,
  fill,
  locked,
  onEdit,
}: BoxLayoutOptions) {
  const root = useRef<HTMLFieldSetElement>(null);
  const [layout, setLayout] = useState<Layout>(
    () =>
      (defaultValue && layoutOf(kind, defaultValue)) ||
      blankLayout(kind, arity),
  );
  const live = useRef(layout);
  const shown = fill === undefined ? layout : (layoutOf(kind, fill) ?? layout);

  const current = () => live.current;
  const commit = (next: Layout) => {
    live.current = next;
    setLayout(next);
    onEdit(sentOf(next));
  };
  const go = (index: number, carry?: string) => {
    const target =
      root.current?.querySelectorAll<MathfieldElement>("math-field")[index];
    if (!target) return false;
    focusBox(target);
    if (carry) typeInto(target, carry);
    return true;
  };
  const clear = () => {
    flushSync(() => commit(blankLayout(kind, arity)));
    go(0);
  };
  const add = (isolated = false, carry?: string) => {
    const now = live.current;
    if (now.kind === "none") return clear();
    const at = boxesOf(now).length;
    flushSync(() => commit(grown(now, arity, isolated)));
    go(at, carry);
  };
  const paste = (text: string) => {
    const next = pastedLayout(kind, text, arity);
    if (!next) return false;
    flushSync(() => commit(next));
    go(boxesOf(next).length - 1);
    return true;
  };
  const edit = (index: number, text: string) => {
    const latex = trimComma(text);
    const none =
      (kind === "values" || kind === "interval") &&
      latex.trim() === "\\emptyset";
    commit(none ? { kind: "none" } : withBox(live.current, index, latex));
  };

  return {
    root,
    current,
    shown,
    readOnly: locked || fill !== undefined,
    commit,
    go,
    clear,
    add,
    paste,
    edit,
  };
}
