"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cva } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { countPick } from "../input-stats";
import type { FieldProps, FieldState } from "./field-frame";

const option = cva(
  "inline-flex min-w-20 items-center justify-center rounded-xl bg-card font-semibold outline-none transition-colors select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-readonly:cursor-default",
  {
    variants: {
      variant: {
        exam: "h-11 border-[1.5px] px-5 text-[15px]",
        solve: "h-12 border-2 px-6 text-base",
      },
      state: {
        open: "border-input text-foreground not-data-readonly:hover:bg-muted",
        empty: "border-foreground bg-muted text-foreground",
        right: "border-success bg-success-tint text-foreground",
        wrong: "border-error bg-error-tint text-foreground",
        unreadable: "border-overtime bg-overtime-tint text-foreground",
        shown: "border-data-soft bg-data-tint text-data",
      },
    },
  },
);

function stateOf(
  picked: boolean,
  { variant, state }: Pick<FieldProps, "variant" | "state">,
): FieldState | "open" {
  if (!picked) return "open";
  return variant === "solve" ? state : "empty";
}

export function ChoiceField({
  id,
  label,
  part,
  variant,
  state,
  locked,
  value,
  stats,
  onEdit,
}: FieldProps) {
  const t = useTranslations("Field");
  const captioned = part.caption || (variant === "exam" && part.letter);
  return (
    <RadioGroup
      id={id}
      aria-labelledby={captioned ? `${id}-label` : undefined}
      aria-label={label}
      value={value}
      readOnly={locked}
      onValueChange={(picked: string) => {
        countPick(stats.current);
        onEdit(picked);
      }}
      className="flex flex-wrap items-center gap-2"
    >
      {variant === "solve" && !part.caption && part.letter && (
        <b className="pr-2 font-semibold text-foreground text-sm">
          {part.letter}
        </b>
      )}
      {part.options.map((choice) => (
        <Radio.Root
          key={choice}
          value={choice}
          nativeButton
          render={<button type="button" />}
          className={option({
            variant,
            state: stateOf(choice === value, { variant, state }),
          })}
        >
          {t(`options.${choice}`)}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
