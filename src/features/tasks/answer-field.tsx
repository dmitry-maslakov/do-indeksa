"use client";

import { cn } from "cn";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
import { MathHtml } from "@/components/math-html";

export type AnswerState = "empty" | "correct" | "wrong";

interface AnswerFieldProps {
  name: string;
  label: string;
  labelHtml: string | null;
  state: AnswerState;
  defaultValue?: string;
  onEdit: (value: string) => void;
}

let setup: Promise<unknown> | undefined;

function loadMathlive() {
  setup ??= import("mathlive").then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = "/mathlive-fonts";
    MathfieldElement.soundsDirectory = null;
    MathfieldElement.decimalSeparator = ",";
  });
  return setup;
}

export function AnswerField({
  name,
  label,
  labelHtml,
  state,
  defaultValue = "",
  onEdit,
}: AnswerFieldProps) {
  const field = useRef<MathfieldElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    loadMathlive();
    const el = field.current;
    if (!el) return;
    const sync = () => {
      setValue(el.value);
      onEdit(el.value);
    };
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [onEdit]);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {labelHtml ? (
        <MathHtml
          html={labelHtml}
          className="text-sm text-subtle [&_p]:inline"
        />
      ) : (
        <span className="text-sm text-subtle">{label}</span>
      )}
      <math-field
        ref={field}
        aria-label={label}
        className={cn(
          "min-h-12 w-full rounded-xl bg-muted px-4 py-2.5 text-base outline-none transition-[background-color,box-shadow] focus-within:bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset",
          state === "correct" &&
            "bg-success-tint text-success-text ring-[1.5px] ring-success ring-inset",
          state === "wrong" &&
            "bg-error-tint text-error-text ring-[1.5px] ring-error ring-inset",
        )}
      >
        {defaultValue}
      </math-field>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
