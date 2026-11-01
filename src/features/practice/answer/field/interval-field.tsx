"use client";

import { useTranslations } from "next-intl";
import { flushSync } from "react-dom";
import {
  boxesOfPiece,
  isFilled,
  isRange,
  locate,
  type Piece,
  shrunk,
  splitAtComma,
  trimComma,
  withBox,
  withBracket,
} from "@/features/catalog/boxes";
import { isInfinite } from "@/features/catalog/kinds";
import { squash } from "@/lib/tex";
import type { BoxKeys } from "./box-keys";
import { type FieldProps, Frame } from "./field-frame";
import { MathBox, NoSolution, slot } from "./math-box";
import { SymbolTray, symbols, TrayButton } from "./symbol-tray";
import { useBoxLayout } from "./use-box-layout";

const glyph = "font-math text-2xl text-muted-foreground";
const comma = "font-math text-muted-foreground text-xl";

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
      className={`${glyph} rounded-md px-0.5 outline-none enabled:hover:bg-muted enabled:hover:text-foreground disabled:cursor-default`}
    >
      {text}
    </button>
  );
}

const isFixed = (end: string) => isInfinite(squash(end));

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
    settle,
    clear,
    add,
    paste,
    edit,
  } = useBoxLayout({
    kind: "interval",
    arity: 0,
    defaultValue,
    fill,
    locked,
    onEdit,
  });
  const pieces = shown.kind === "interval" ? shown.pieces : [];
  const firstOf = (group: number) =>
    pieces
      .slice(0, group)
      .reduce((size, piece) => size + (isRange(piece) ? 2 : 1), 0);

  const keysOf = (index: number): BoxKeys => ({
    next: (carry) => go(index + 1, carry),
    back: () => {
      const layout = current();
      const { group, index: column } = locate(layout, index);
      const last = layout.kind === "interval" && layout.pieces[group];
      const empty = last && !boxesOfPiece(last).some(isFilled);
      go(index - 1);
      if (column === 0 && group > 0 && empty)
        flushSync(() => commit(shrunk(layout, group)));
    },
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
    const first = firstOf(group);
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
          fixed={readOnly || isFixed(item.from)}
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
          fixed={readOnly || isFixed(item.to)}
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
            <NoSolution
              label={t("clearNoSolution")}
              locked={readOnly}
              onClear={clear}
            />
          )}
          {pieces.map((item, group) => (
            <span key={firstOf(group)} className="flex items-center gap-1">
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
        keys={[symbols.infinity, symbols.root, symbols.pi, symbols.fraction]}
        active={active}
        locked={readOnly}
        hint={t("hintInterval")}
      >
        <TrayButton onPress={() => add()}>∪ {t("addPiece")}</TrayButton>
        <TrayButton
          onPress={() => add(true)}
        >{`{a} ${t("addIsolated")}`}</TrayButton>
        <TrayButton onPress={() => commit({ kind: "none" })}>∅</TrayButton>
      </SymbolTray>
    </>
  );
}
