"use client";

import { cva } from "class-variance-authority";
import { useCallback } from "react";
import { MathHtml } from "@/components/math-html";
import { StatusIcon } from "@/features/progress/status-icon";
import type { AnswerState } from "./answer-state";
import type { PartLabel } from "./parts";
import { useMathField } from "./use-math-field";

type Variant = "exam" | "solve";

interface AnswerFieldProps {
  id: string;
  index: number;
  name: string;
  label: string;
  part: PartLabel;
  variant: Variant;
  state?: AnswerState;
  defaultValue?: string;
  placeholder?: string;
  onChange: (index: number, value: string) => void;
}

const box = cva("flex items-center transition-colors", {
  variants: {
    variant: {
      exam: "min-h-12 rounded-xl bg-muted px-4 focus-within:bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset",
      solve:
        "h-14 rounded-xl border-2 border-input bg-card focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10",
    },
    state: {
      empty: "",
      correct: "border-success bg-success-tint",
      wrong: "border-error bg-error-tint",
    },
  },
});

const input = cva(
  "min-w-0 flex-1 bg-transparent text-foreground outline-none",
  {
    variants: {
      variant: { exam: "py-3 text-lg", solve: "h-full pr-4 pl-2 text-xl" },
    },
  },
);

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

function Prefix({ part }: Pick<AnswerFieldProps, "part">) {
  const letter = !part.caption && part.letter;
  if (!letter && !part.prefix) return null;
  return (
    <span className="flex max-w-1/2 items-center gap-2 overflow-hidden whitespace-nowrap pl-4 font-math text-muted-foreground text-xl italic">
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

export function AnswerField({
  id,
  index,
  name,
  label,
  part,
  variant,
  state = "empty",
  defaultValue = "",
  placeholder,
  onChange,
}: AnswerFieldProps) {
  const onEdit = useCallback(
    (value: string) => onChange(index, value),
    [index, onChange],
  );
  const { field, value } = useMathField(defaultValue, onEdit);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Caption id={id} part={part} variant={variant} />
      <div
        className={box({
          variant,
          state: variant === "solve" ? state : "empty",
        })}
      >
        {variant === "solve" && <Prefix part={part} />}
        <math-field
          id={id}
          ref={field}
          aria-label={label}
          placeholder={placeholder}
          className={input({ variant })}
        >
          {defaultValue}
        </math-field>
        {state !== "empty" && (
          <span className="flex pr-4">
            <StatusIcon
              status={state === "correct" ? "solved" : "wrong"}
              className="size-5"
            />
          </span>
        )}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
