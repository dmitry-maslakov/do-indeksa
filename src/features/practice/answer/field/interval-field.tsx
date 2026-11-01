"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import {
  isInfiniteEnd,
  isRange,
  locate,
  type Piece,
  splitAtComma,
  startOf,
  trimComma,
  withBox,
  withBracket,
} from "@/features/catalog/boxes";
import type { BoxKeys } from "./box-keys";
import { type FieldProps, Frame } from "./field-frame";
import { comma, glyph, MathBox, NoSolution, slot } from "./math-box";
import { SymbolTray, TrayButton, trayKeys } from "./symbol-tray";
import { useBoxLayout } from "./use-box-layout";

function Bracket({
  side,
  label,
  square,
  fixed,
  onToggle,
}: {
  side: "open" | "close";
  label: string;
  square: boolean;
  fixed: boolean;
  onToggle: () => void;
}) {
  const text = side === "open" ? (square ? "[" : "(") : square ? "]" : ")";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={square}
      disabled={fixed}
      tabIndex={-1}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggle}
      className={cn(
        glyph,
        "inline-flex h-9 min-w-7 items-center justify-center rounded-lg border-[1.5px] border-transparent px-1 outline-none disabled:cursor-default",
        "enabled:border-subtle/80 enabled:border-dashed enabled:text-foreground enabled:hover:border-subtle enabled:hover:bg-muted",
      )}
    >
      {text}
    </button>
  );
}

export function IntervalField({
  id,
  label,
  part,
  variant,
  state,
  locked,
  fill,
  defaultValue,
  invalid,
  reason,
  active,
  stats,
  onEdit,
}: FieldProps) {
  const t = useTranslations("Field");
  const {
    root,
    current,
    shown,
    readOnly,
    commit,
    go,
    back,
    settle,
    clear,
    add,
    paste,
    edit,
  } = useBoxLayout("interval", { part, defaultValue, fill, locked, onEdit });
  const pieces = shown.kind === "interval" ? shown.pieces : [];

  const keysOf = (index: number): BoxKeys => ({
    next: (carry) => go(index + 1, carry),
    back: () => back(index),
    step: (direction) => go(index + direction),
    bracket: (bracket, text) => {
      const layout = withBox(current(), index, trimComma(text));
      const closing = bracket === ")" || bracket === "]";
      const settled = closing ? splitAtComma(layout, index) : layout;
      commit(withBracket(settled, locate(layout, index).group, bracket));
      if (settled === layout) return;
      settle(index);
      go(index + 1);
    },
    union: () => add(),
    none: () => commit({ kind: "none" }),
    paste,
  });

  const piece = (item: Piece, group: number) => {
    const first = startOf(shown, group);
    const box = (
      index: number,
      text: string,
      name: "from" | "to" | "isolated",
    ) => (
      <MathBox
        id={index === 0 ? id : undefined}
        active={active}
        value={text}
        label={t(name, { number: group + 1 })}
        keyboard="interval"
        keys={keysOf(index)}
        locked={readOnly}
        invalid={invalid === index}
        className={slot({ shown: state === "shown" })}
        stats={stats}
        onEdit={(latex) => edit(index, latex)}
      />
    );
    if (!isRange(item))
      return (
        <>
          <span className={glyph}>{"{"}</span>
          {box(first, item.point, "isolated")}
          <span className={glyph}>{"}"}</span>
        </>
      );
    return (
      <>
        <Bracket
          side="open"
          label={t("open")}
          square={item.open === "["}
          fixed={readOnly || isInfiniteEnd(item.from)}
          onToggle={() =>
            commit(withBracket(current(), group, item.open === "(" ? "[" : "("))
          }
        />
        {box(first, item.from, "from")}
        <span className={comma}>,</span>
        {box(first + 1, item.to, "to")}
        <Bracket
          side="close"
          label={t("close")}
          square={item.close === "]"}
          fixed={readOnly || isInfiniteEnd(item.to)}
          onToggle={() =>
            commit(
              withBracket(current(), group, item.close === ")" ? "]" : ")"),
            )
          }
        />
      </>
    );
  };

  return (
    <>
      <Frame part={part} variant={variant} state={state} reason={reason} wrap>
        <fieldset ref={root} aria-label={label} className="contents">
          {shown.kind === "none" && (
            <NoSolution locked={readOnly} onClear={clear} />
          )}
          {pieces.map((item, group) => (
            <span
              key={startOf(shown, group)}
              className="flex items-center gap-1"
            >
              {group > 0 && <span className={glyph}>∪</span>}
              {piece(item, group)}
            </span>
          ))}
          {!readOnly && shown.kind !== "none" && (
            <TrayButton round label={t("addPiece")} onPress={() => add()}>
              ∪
            </TrayButton>
          )}
        </fieldset>
      </Frame>
      <SymbolTray
        keys={trayKeys(part, "root", "pi", "fraction")}
        active={active}
        locked={readOnly}
      >
        <TrayButton onPress={() => add()}>∪ {t("addPiece")}</TrayButton>
        <TrayButton
          onPress={() => add(true)}
        >{`{a} ${t("addIsolated")}`}</TrayButton>
        <TrayButton math onPress={() => commit({ kind: "none" })}>
          ∅
        </TrayButton>
        <TrayButton math onPress={() => active.current?.insert("-\\infty")}>
          −∞
        </TrayButton>
        <TrayButton math onPress={() => active.current?.insert("+\\infty")}>
          +∞
        </TrayButton>
      </SymbolTray>
    </>
  );
}
