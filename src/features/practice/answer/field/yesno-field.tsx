"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import { useTranslations } from "next-intl";
import { yesNo } from "@/features/catalog/kinds";
import { StatusIcon } from "@/features/progress/status-icon";
import { countPick } from "../input-stats";
import type { FieldProps } from "./field-frame";

const option = cva(
  "min-w-16 rounded-lg px-4 py-1.5 font-medium text-sm transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring data-unchecked:text-subtle not-data-readonly:data-unchecked:hover:text-foreground data-readonly:cursor-default",
  {
    variants: {
      state: {
        empty:
          "data-checked:bg-card data-checked:text-foreground data-checked:shadow-sm",
        right: "data-checked:bg-success-tint data-checked:text-success-text",
        wrong: "data-checked:bg-error-tint data-checked:text-error-text",
        unreadable:
          "data-checked:bg-overtime-tint data-checked:text-overtime-text",
        shown: "data-checked:bg-data-tint data-checked:text-data",
      },
    },
  },
);

export function YesNoField({
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
  const verdict = variant === "solve" ? state : "empty";
  return (
    <div
      className={cn("flex items-center gap-3", !locked && "pointer-fine:mb-10")}
    >
      {variant === "solve" && !part.caption && part.letter && (
        <b className="font-semibold text-foreground text-sm">{part.letter}</b>
      )}
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
        className="flex gap-1 rounded-xl bg-muted p-1"
      >
        {yesNo.map((choice) => (
          <Radio.Root
            key={choice}
            value={choice}
            nativeButton
            render={<button type="button" />}
            className={option({ state: verdict })}
          >
            {t(choice)}
          </Radio.Root>
        ))}
      </RadioGroup>
      {(verdict === "right" || verdict === "wrong") && (
        <StatusIcon
          status={verdict === "right" ? "solved" : "wrong"}
          className="size-5"
        />
      )}
    </div>
  );
}
