"use client";

import { cva } from "class-variance-authority";
import { cn } from "cn";
import { EyeIcon, LockIcon } from "lucide-react";
import type { RefObject } from "react";
import { MathHtml } from "@/components/math-html";
import type { PartOutcome } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import { StatusIcon } from "@/features/progress/status-icon";
import type { InputStats } from "./input-stats";
import { useMathField } from "./use-math-field";

type Variant = "exam" | "solve";

export type FieldState = PartOutcome | "shown";

interface AnswerFieldProps {
  id: string;
  index: number;
  name: string;
  label: string;
  part: PartLabel;
  variant: Variant;
  state?: FieldState;
  locked?: boolean;
  fill?: string;
  defaultValue?: string;
  placeholder?: string;
  stats: RefObject<InputStats>;
  onChange: (index: number, value: string) => void;
}

const box = cva("flex items-center transition-colors", {
  variants: {
    variant: {
      exam: "min-h-13 rounded-xl border-[1.5px] bg-card px-3.5 focus-within:ring-2 focus-within:ring-foreground/10",
      solve:
        "h-14 rounded-xl border-2 bg-card focus-within:ring-2 focus-within:ring-foreground/10",
    },
    state: {
      empty: "border-input",
      right: "border-success bg-success-tint",
      wrong: "border-error bg-error-tint",
      unreadable: "border-overtime bg-overtime-tint",
      shown: "border-data-soft bg-data-tint",
    },
  },
  compoundVariants: [
    {
      state: ["empty", "wrong", "unreadable"],
      class: "focus-within:border-foreground",
    },
  ],
});

const input = cva("min-w-0 flex-1 bg-transparent outline-none", {
  variants: {
    variant: { exam: "py-2.5 text-lg", solve: "h-full pr-4 pl-2 text-xl" },
    shown: { true: "text-data", false: "text-foreground" },
  },
});

const inline = "[&_p]:inline";

function Caption({
  id,
  part,
  variant,
}: Pick<AnswerFieldProps, "id" | "part" | "variant">) {
  const text =
    variant === "exam" ? (part.caption ?? part.prefix) : part.caption;
  if (!text && !(variant === "exam" && part.letter)) return null;
  return (
    <label htmlFor={id} className="text-muted-foreground text-sm">
      <b className="font-semibold text-foreground">{part.letter}</b>{" "}
      {text && <MathHtml as="span" html={text} className={inline} />}
    </label>
  );
}

function Prefix({
  part,
  shown,
}: Pick<AnswerFieldProps, "part"> & { shown: boolean }) {
  const letter = !part.caption && part.letter;
  if (!letter && !part.prefix) return null;
  return (
    <span
      className={cn(
        "flex max-w-1/2 items-center gap-2 overflow-hidden whitespace-nowrap pl-4 font-math text-xl italic",
        shown ? "text-data-soft" : "text-muted-foreground",
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

function Mark({ state }: { state: FieldState }) {
  if (state === "right" || state === "wrong")
    return (
      <span className="flex pr-4">
        <StatusIcon
          status={state === "right" ? "solved" : "wrong"}
          className="size-5"
        />
      </span>
    );
  if (state === "shown")
    return (
      <span className="flex items-center gap-1.5 pr-4">
        <LockIcon aria-hidden className="size-4 text-data-soft" />
        <EyeIcon aria-hidden className="size-5 text-data" />
      </span>
    );
  return null;
}

export function AnswerField({
  id,
  index,
  name,
  label,
  part,
  variant,
  state = "empty",
  locked = false,
  fill,
  defaultValue = "",
  placeholder,
  stats,
  onChange,
}: AnswerFieldProps) {
  const onEdit = (value: string) => onChange(index, value);
  const { field, value } = useMathField(defaultValue, onEdit, stats, fill);
  const shown = state === "shown";

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Caption id={id} part={part} variant={variant} />
      <div
        className={box({
          variant,
          state: variant === "solve" ? state : "empty",
        })}
      >
        {variant === "solve" && <Prefix part={part} shown={shown} />}
        <math-field
          id={id}
          ref={field}
          aria-label={label}
          placeholder={placeholder}
          readOnly={locked}
          className={input({ variant, shown })}
        >
          {defaultValue}
        </math-field>
        <Mark state={state} />
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
