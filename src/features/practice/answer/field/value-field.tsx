"use client";

import { cva } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { type FieldProps, Frame } from "./field-frame";
import { MathBox } from "./math-box";
import { SymbolTray, symbols } from "./symbol-tray";

const input = cva("min-w-0 flex-1 self-center bg-transparent outline-none", {
  variants: {
    variant: { exam: "py-2.5 text-lg", solve: "pr-4 pl-2 text-xl" },
    shown: { true: "text-data", false: "text-foreground" },
  },
});

export function ValueField({
  id,
  label,
  part,
  variant,
  state,
  locked,
  value,
  placeholder,
  reason,
  active,
  stats,
  onEdit,
}: FieldProps) {
  const t = useTranslations("Field");

  return (
    <>
      <Frame part={part} variant={variant} state={state} reason={reason}>
        <MathBox
          id={id}
          active={active}
          value={value}
          label={label}
          keyboard="value"
          locked={locked}
          placeholder={placeholder}
          className={input({ variant, shown: state === "shown" })}
          stats={stats}
          onEdit={onEdit}
        />
      </Frame>
      <SymbolTray
        keys={[
          symbols.root,
          symbols.pi,
          symbols.fraction,
          symbols.power,
          symbols.log,
        ]}
        active={active}
        locked={locked}
        hint={t("hintValue")}
      />
    </>
  );
}
