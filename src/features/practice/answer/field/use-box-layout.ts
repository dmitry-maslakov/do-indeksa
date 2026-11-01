import type { MathfieldElement } from "mathlive";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  type BoxKind,
  blankLayout,
  boxesOf,
  groupsOf,
  grown,
  isFilled,
  type Layout,
  layoutOf,
  locate,
  noSolution,
  pastedLayout,
  sentOf,
  shrunk,
  trimComma,
  withBox,
} from "@/features/catalog/boxes";
import { focusBox, typeInto } from "./box-keys";
import type { FieldProps } from "./field-frame";

export function useBoxLayout(
  kind: BoxKind,
  {
    part: { arity },
    defaultValue,
    fill,
    locked,
    onEdit,
  }: Pick<FieldProps, "part" | "defaultValue" | "fill" | "locked" | "onEdit">,
) {
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
  const boxAt = (index: number) =>
    root.current?.querySelectorAll<MathfieldElement>("math-field")[index];
  const go = (index: number, carry?: string) => {
    const target = boxAt(index);
    if (!target) return false;
    focusBox(target);
    if (carry) typeInto(target, carry);
    return true;
  };
  const back = (index: number) => {
    const layout = live.current;
    const { group, index: column } = locate(layout, index);
    go(index - 1);
    const removable = kind === "interval" ? group > 0 : kind !== "point";
    if (removable && column === 0 && !groupsOf(layout)[group]?.some(isFilled))
      flushSync(() => commit(shrunk(layout, group)));
  };
  const settle = (index: number) => {
    const target = boxAt(index);
    const text = boxesOf(live.current)[index];
    if (target && text !== undefined && trimComma(target.value) !== text)
      target.value = text;
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
      (kind === "values" || kind === "interval") && latex.trim() === noSolution;
    commit(none ? { kind: "none" } : withBox(live.current, index, latex));
  };

  return {
    root,
    current,
    shown,
    readOnly: locked || fill !== undefined,
    commit,
    go,
    back,
    settle,
    clear,
    add,
    paste,
    edit,
  };
}
