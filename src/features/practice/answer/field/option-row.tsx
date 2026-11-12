import { cva } from "class-variance-authority";
import { cn } from "cn";
import type { ReactNode } from "react";
import { MathHtml } from "@/components/math-html";

export type OptionLook = "idle" | "on" | "right" | "wrong" | "missed" | "shown";

export const optionRow = cva(
  "flex w-full items-center text-left ring-inset outline-none transition-[background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2",
  {
    variants: {
      size: {
        lg: "min-h-15 gap-3.5 rounded-[14px] py-2.5 pr-4 pl-3 text-task",
        sm: "min-h-12 gap-3 rounded-xl py-1.5 pr-3.5 pl-2.5 text-base",
      },
      look: {
        idle: "bg-muted",
        on: "bg-card ring-2 ring-foreground",
        right: "bg-success-tint ring-2 ring-success",
        wrong: "bg-error-tint ring-2 ring-error",
        missed: "bg-card ring-2 ring-success",
        shown: "bg-data-tint ring-2 ring-data-soft",
      },
    },
  },
);

const key = cva(
  "grid shrink-0 place-items-center font-semibold leading-none ring-inset",
  {
    variants: {
      size: { lg: "size-7.5 text-sm", sm: "size-6.5 text-[13px]" },
      many: { true: "rounded-lg", false: "rounded-full" },
      look: {
        idle: "bg-card ring-[1.5px] ring-input",
        on: "bg-foreground text-background",
        right: "bg-success text-white",
        wrong: "bg-error text-white",
        missed: "bg-card text-success-text ring-[1.5px] ring-success",
        shown: "bg-data text-white",
      },
    },
  },
);

interface OptionBodyProps {
  letter: string;
  html: string;
  many: boolean;
  look: OptionLook;
  size: "lg" | "sm";
  end?: ReactNode;
}

export function OptionBody({
  letter,
  html,
  many,
  look,
  size,
  end,
}: OptionBodyProps) {
  return (
    <>
      <span className={key({ size, many, look })}>{letter}</span>
      <MathHtml as="span" html={html} className="min-w-0 flex-1 [&_p]:inline" />
      {end}
    </>
  );
}

export const optionList = (short: boolean) =>
  cn("grid gap-2", short && "md:grid-cols-2 md:gap-x-3");
