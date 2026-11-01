"use client";

import { cva } from "class-variance-authority";
import { XIcon } from "lucide-react";
import type { MathfieldElement } from "mathlive";
import { useTranslations } from "next-intl";
import { type RefObject, useRef, useState } from "react";
import type { Kind } from "@/features/catalog/kinds";
import type { AnswerSymbol } from "@/features/catalog/parts";
import type { InputStats } from "../input-stats";
import type { BoxKeys } from "./box-keys";
import { useMathBox } from "./use-math-box";

export const slot = cva(
  "min-h-9 min-w-10 max-w-full rounded-[9px] bg-muted px-2.5 text-xl outline-none focus-within:bg-card focus-within:ring-[1.5px] focus-within:ring-foreground data-invalid:bg-card data-invalid:ring-2 data-invalid:ring-overtime",
  {
    variants: {
      shown: {
        true: "bg-card text-data [&[read-only]]:bg-card",
        false: "text-foreground",
      },
    },
  },
);

export const glyph = "font-math text-2xl text-muted-foreground";

export const comma = "font-math text-muted-foreground text-xl";

export function NoSolution({
  locked,
  onClear,
}: {
  locked: boolean;
  onClear: () => void;
}) {
  const t = useTranslations("Field");
  return (
    <button
      type="button"
      aria-label={t("clearNoSolution")}
      disabled={locked}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onClear}
      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-card px-3 font-math text-foreground text-xl outline-none ring-[1.5px] ring-foreground/20 hover:ring-foreground focus-visible:ring-foreground disabled:text-data disabled:ring-data-soft"
    >
      ∅{!locked && <XIcon aria-hidden className="size-3.5 text-subtle" />}
    </button>
  );
}

interface MathBoxProps {
  id?: string;
  active: RefObject<MathfieldElement | null>;
  value: string;
  label: string;
  keyboard: Kind;
  symbols: AnswerSymbol[];
  keys?: BoxKeys;
  locked: boolean;
  invalid?: boolean;
  placeholder?: string;
  className: string;
  stats: RefObject<InputStats>;
  onEdit: (latex: string) => void;
}

export function MathBox({
  id,
  active,
  value,
  label,
  keyboard,
  symbols,
  keys,
  locked,
  invalid,
  placeholder,
  className,
  stats,
  onEdit,
}: MathBoxProps) {
  const t = useTranslations("Field");
  const field = useRef<MathfieldElement>(null);
  const [initial] = useState(value);
  useMathBox(field, {
    active,
    value,
    keyboard,
    symbols,
    next: t("next"),
    keys,
    stats,
    onEdit,
  });

  return (
    <math-field
      id={id}
      ref={field}
      aria-label={label}
      placeholder={placeholder}
      readOnly={locked}
      data-invalid={invalid ? "" : undefined}
      className={className}
    >
      {initial}
    </math-field>
  );
}
