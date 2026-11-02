"use client";

import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, type ReactNode } from "react";
import { boxesOf, groupsOf, startOf } from "@/features/catalog/boxes";
import type { BoxKeys } from "./box-keys";
import { type FieldProps, Frame } from "./field-frame";
import { comma, glyph, MathBox, NoSolution, slot } from "./math-box";
import { SymbolTray, TrayButton } from "./symbol-tray";
import { useBoxLayout } from "./use-box-layout";

interface SlotsFieldProps extends FieldProps {
  kind: "values" | "point" | "points" | "sequence";
}

const unit = "flex max-w-full flex-wrap items-center gap-1";

function Numbered({ at, children }: { at?: number; children: ReactNode }) {
  if (at === undefined) return children;
  return (
    <span className="relative inline-flex max-w-full">
      {children}
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-4 text-center text-subtle text-xs leading-4 tabular-nums"
      >
        {at}
      </span>
    </span>
  );
}

const boxLabel = {
  values: "value",
  point: "coordinate",
  points: "coordinate",
  sequence: "position",
} as const;

const hintOf = {
  values: "hintValues",
  point: "hintPoint",
  points: "hintPoint",
  sequence: "hintSequence",
} as const;

export function SlotsField({
  kind,
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
}: SlotsFieldProps) {
  const t = useTranslations("Field");
  const {
    root,
    current,
    shown,
    readOnly,
    commit,
    go,
    back,
    clear,
    add,
    paste,
    edit,
  } = useBoxLayout(kind, { part, defaultValue, fill, locked, onEdit });
  const rows = groupsOf(shown);
  const grows = kind === "values" || kind === "points";
  const tupled = kind === "point" || kind === "points";

  const keysOf = (index: number): BoxKeys => ({
    next: (carry) => {
      if (index + 1 < boxesOf(current()).length) go(index + 1, carry);
      else if (grows) add(false, carry);
    },
    back: () => back(index),
    step: (direction) => go(index + direction),
    none: kind === "values" ? () => commit({ kind: "none" }) : undefined,
    paste,
  });

  const addLabel = t(kind === "values" ? "addValue" : "addPoint");

  return (
    <>
      <Frame part={part} variant={variant} state={state} reason={reason} wrap>
        <fieldset ref={root} aria-label={label} className="contents">
          {shown.kind === "none" && (
            <NoSolution locked={readOnly} onClear={clear} />
          )}
          {rows.map((cells, group) => (
            <span
              key={startOf(shown, group)}
              className={cn(unit, kind === "sequence" && "pb-4")}
            >
              {group > 0 && <span className={comma}>,</span>}
              {tupled && <span className={glyph}>(</span>}
              {cells.map((text, column) => {
                const index = startOf(shown, group) + column;
                return (
                  <Fragment key={index}>
                    {column > 0 && <span className={comma}>,</span>}
                    <Numbered at={kind === "sequence" ? column + 1 : undefined}>
                      <MathBox
                        id={index === 0 ? id : undefined}
                        active={active}
                        value={text}
                        label={t(boxLabel[kind], {
                          number: (kind === "values" ? index : column) + 1,
                        })}
                        keyboard={kind}
                        symbols={part.symbols}
                        keys={keysOf(index)}
                        locked={readOnly}
                        invalid={invalid === index}
                        className={slot({ shown: state === "shown" })}
                        stats={stats}
                        onEdit={(latex) => edit(index, latex)}
                      />
                    </Numbered>
                  </Fragment>
                );
              })}
              {tupled && <span className={glyph}>)</span>}
            </span>
          ))}
          {grows && !readOnly && shown.kind !== "none" && (
            <TrayButton round label={addLabel} onPress={() => add()}>
              <PlusIcon aria-hidden className="size-4" />
            </TrayButton>
          )}
        </fieldset>
      </Frame>
      <SymbolTray
        symbols={part.symbols}
        active={active}
        locked={readOnly}
        hint={t(hintOf[kind])}
      >
        {grows && (
          <TrayButton onPress={() => add()}>
            <PlusIcon aria-hidden className="size-3.5" />
            {addLabel}
          </TrayButton>
        )}
        {kind === "values" && (
          <TrayButton onPress={() => commit({ kind: "none" })}>
            {t("noSolutionShort")}
          </TrayButton>
        )}
      </SymbolTray>
    </>
  );
}
