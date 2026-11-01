"use client";

import type { MathfieldElement } from "mathlive";
import { type RefObject, useRef, useState } from "react";
import { MathHtml } from "@/components/math-html";
import type { Problem } from "@/features/catalog/boxes";
import type { PartLabel } from "@/features/catalog/parts";
import type { FieldState } from "./field/field-frame";
import { IntervalField } from "./field/interval-field";
import { SlotsField } from "./field/slots-field";
import { ValueField } from "./field/value-field";
import type { InputStats } from "./input-stats";

interface AnswerFieldProps {
  id: string;
  index: number;
  name: string;
  label: string;
  part: PartLabel;
  variant: "exam" | "solve";
  state?: FieldState;
  problem?: Problem | null;
  locked?: boolean;
  fill?: string;
  defaultValue?: string;
  placeholder?: string;
  stats: RefObject<InputStats>;
  onChange: (index: number, value: string) => void;
}

function Caption({
  id,
  part,
  variant,
}: Pick<AnswerFieldProps, "id" | "part" | "variant">) {
  if (!part.caption && !(variant === "exam" && part.letter)) return null;
  return (
    <label htmlFor={id} className="text-muted-foreground text-sm">
      <b className="font-semibold text-foreground">{part.letter}</b>{" "}
      {part.caption && (
        <MathHtml as="span" html={part.caption} className="[&_p]:inline" />
      )}
    </label>
  );
}

export function AnswerField({
  index,
  name,
  state = "empty",
  problem,
  locked = false,
  defaultValue = "",
  onChange,
  ...props
}: AnswerFieldProps) {
  const active = useRef<MathfieldElement>(null);
  const [value, setValue] = useState(defaultValue);
  const { id, part, variant, fill } = props;
  const sent = fill ?? value;
  const unreadable = state === "unreadable" ? problem : undefined;
  const field = {
    ...props,
    state,
    locked,
    defaultValue,
    value: sent,
    invalid: unreadable?.box,
    reason: unreadable?.reason,
    active,
    onEdit: (latex: string) => {
      setValue(latex);
      onChange(index, latex);
    },
  };
  return (
    <div className="group/field flex min-w-0 flex-col gap-2">
      <Caption id={id} part={part} variant={variant} />
      {part.kind === "values" ||
      part.kind === "point" ||
      part.kind === "points" ? (
        <SlotsField {...field} kind={part.kind} />
      ) : part.kind === "interval" ? (
        <IntervalField {...field} />
      ) : (
        <ValueField {...field} />
      )}
      <input type="hidden" name={name} value={sent} />
    </div>
  );
}
