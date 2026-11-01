"use client";

import { cva } from "class-variance-authority";
import { cn } from "cn";
import { EyeIcon, LockIcon } from "lucide-react";
import type { MathfieldElement } from "mathlive";
import { useTranslations } from "next-intl";
import type { PointerEvent, ReactNode, RefObject } from "react";
import { MathHtml } from "@/components/math-html";
import type { PartOutcome } from "@/db/columns";
import type { Reason } from "@/features/catalog/boxes";
import type { PartLabel } from "@/features/catalog/parts";
import { StatusIcon } from "@/features/progress/status-icon";
import type { InputStats } from "../input-stats";
import { focusBox } from "./box-keys";

type Variant = "exam" | "solve";

export type FieldState = PartOutcome | "shown";

export interface FieldProps {
  id: string;
  label: string;
  part: PartLabel;
  variant: Variant;
  state: FieldState;
  locked: boolean;
  fill?: string;
  defaultValue: string;
  placeholder?: string;
  invalid?: number;
  reason?: Reason;
  active: RefObject<MathfieldElement | null>;
  stats: RefObject<InputStats>;
  onEdit: (latex: string) => void;
}

const frame = cva("flex items-center transition-colors", {
  variants: {
    variant: {
      exam: "min-h-13 rounded-xl border-[1.5px] bg-card px-3.5 focus-within:ring-2 focus-within:ring-foreground/10",
      solve:
        "min-h-14 rounded-xl border-2 bg-card focus-within:ring-2 focus-within:ring-foreground/10",
    },
    state: {
      empty: "border-input",
      right: "border-success bg-success-tint",
      wrong: "border-error bg-error-tint",
      unreadable: "border-overtime bg-overtime-tint",
      shown: "border-data-soft bg-data-tint",
    },
    wrap: { true: "flex-wrap gap-x-1.5 gap-y-1.5 py-2", false: "" },
  },
  compoundVariants: [
    {
      state: ["empty", "wrong", "unreadable"],
      class: "focus-within:border-foreground",
    },
  ],
});

const inline = "[&_p]:inline";

const affix = cva(
  "flex items-center gap-2 overflow-hidden whitespace-nowrap font-math italic",
  {
    variants: {
      variant: { exam: "text-lg", solve: "text-xl" },
      shown: { true: "text-data", false: "text-muted-foreground" },
    },
  },
);

function Prefix({
  part,
  variant,
  shown,
}: Pick<FieldProps, "part" | "variant"> & { shown: boolean }) {
  const letter = variant === "solve" && !part.caption && part.letter;
  if (!letter && !part.prefix) return null;
  return (
    <span
      className={cn(
        affix({ variant, shown }),
        "max-w-1/2",
        variant === "solve" ? "pl-4" : "pr-2",
      )}
    >
      {letter && (
        <b className="font-sans font-semibold text-foreground text-sm not-italic">
          {letter}
        </b>
      )}
      {part.prefix && (
        <MathHtml as="span" html={part.prefix} className={inline} />
      )}
    </span>
  );
}

function Suffix({
  part,
  variant,
  shown,
}: Pick<FieldProps, "part" | "variant"> & { shown: boolean }) {
  if (!part.suffix) return null;
  return (
    <span
      className={cn(
        affix({ variant, shown }),
        "max-w-1/3",
        variant === "solve" ? "pr-4 pl-1" : "pl-2",
      )}
    >
      <MathHtml as="span" html={part.suffix} className={inline} />
    </span>
  );
}

function Mark({ state }: { state: FieldState }) {
  if (state === "right" || state === "wrong")
    return (
      <span className="ml-auto flex pr-4">
        <StatusIcon
          status={state === "right" ? "solved" : "wrong"}
          className="size-5"
        />
      </span>
    );
  if (state === "shown")
    return (
      <span className="ml-auto flex items-center gap-1.5 pr-4">
        <LockIcon aria-hidden className="size-4 text-data-soft" />
        <EyeIcon aria-hidden className="size-5 text-data" />
      </span>
    );
  return null;
}

function focusFirst(event: PointerEvent<HTMLDivElement>) {
  if ((event.target as Element).closest("math-field, button")) return;
  const first = event.currentTarget.querySelector<MathfieldElement>(
    "math-field:not([read-only])",
  );
  if (!first) return;
  event.preventDefault();
  focusBox(first);
}

const reasonKeys = {
  fraction: "problemFraction",
  bracket: "problemBracket",
  end: "problemEnd",
  coordinate: "problemCoordinate",
  decimal: "problemDecimal",
  expression: "problemExpression",
} as const satisfies Record<Reason, string>;

function Reading({ reason }: { reason: Reason }) {
  const t = useTranslations("Field");
  return (
    <p role="alert" className="-mt-0.5 text-overtime-text text-sm">
      {t(reasonKeys[reason])}
    </p>
  );
}

interface FrameProps
  extends Pick<FieldProps, "part" | "variant" | "state" | "reason"> {
  wrap?: boolean;
  children: ReactNode;
}

export function Frame({
  part,
  variant,
  state,
  reason,
  wrap = false,
  children,
}: FrameProps) {
  const shown = state === "shown";
  return (
    <>
      <div
        data-field={part.kind ?? "value"}
        onPointerDown={focusFirst}
        className={frame({
          variant,
          state: variant === "solve" ? state : "empty",
          wrap,
        })}
      >
        <Prefix part={part} variant={variant} shown={shown} />
        {children}
        <Suffix part={part} variant={variant} shown={shown} />
        <Mark state={state} />
      </div>
      {reason && <Reading reason={reason} />}
    </>
  );
}
