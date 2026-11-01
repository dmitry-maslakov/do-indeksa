"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { flushSync } from "react-dom";
import {
  boxesOf,
  groupsOf,
  isFilled,
  locate,
  shrunk,
} from "@/features/catalog/boxes";
import type { BoxKeys } from "./box-keys";
import { type FieldProps, Frame } from "./field-frame";
import { MathBox, NoSolution, slot } from "./math-box";
import { SymbolTray, symbols, TrayButton } from "./symbol-tray";
import { useBoxLayout } from "./use-box-layout";

interface SlotsFieldProps extends FieldProps {
  kind: "values" | "point" | "points";
  arity: number;
}

const unit = "flex items-center gap-1";
const comma = "font-math text-muted-foreground text-xl";
const paren = "font-math text-2xl text-muted-foreground";

export function SlotsField({
  kind,
  arity,
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
  const { root, layout, shown, readOnly, commit, go, clear, add, edit } =
    useBoxLayout({ kind, arity, defaultValue, fill, locked, onEdit });
  const rows = groupsOf(shown);
  const grows = kind !== "point";
  const firstOf = (group: number) =>
    rows.slice(0, group).reduce((size, row) => size + row.length, 0);

  const keysOf = (index: number): BoxKeys => ({
    next: (carry) => {
      if (index + 1 < boxesOf(layout).length) go(index + 1, carry);
      else if (grows) add(false, carry);
    },
    back: () => {
      const { group, index: column } = locate(layout, index);
      go(index - 1);
      if (grows && column === 0 && !rows[group]?.some(isFilled))
        flushSync(() => commit(shrunk(layout, group)));
    },
    step: (direction) => go(index + direction),
    none: kind === "values" ? () => commit({ kind: "none" }) : undefined,
  });

  const addLabel = t(kind === "values" ? "addValue" : "addPoint");

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
          {rows.map((cells, group) => (
            <span key={firstOf(group)} className={unit}>
              {group > 0 && <span className={comma}>,</span>}
              {kind !== "values" && <span className={paren}>(</span>}
              {cells.map((text, column) => {
                const index = firstOf(group) + column;
                return (
                  <Fragment key={index}>
                    {column > 0 && <span className={comma}>,</span>}
                    <MathBox
                      id={index === 0 ? id : undefined}
                      active={active}
                      value={text}
                      label={t(kind === "values" ? "value" : "coordinate", {
                        number: (kind === "values" ? index : column) + 1,
                      })}
                      keyboard={kind}
                      keys={keysOf(index)}
                      locked={readOnly}
                      invalid={invalid === index}
                      className={slot({ shown: state === "shown" })}
                      stats={stats}
                      onEdit={(latex) => edit(index, latex)}
                    />
                  </Fragment>
                );
              })}
              {kind !== "values" && <span className={paren}>)</span>}
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
        keys={[symbols.root, symbols.pi, symbols.fraction]}
        active={active}
        hint={t(kind === "point" ? "hintPoint" : "hintValues")}
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
