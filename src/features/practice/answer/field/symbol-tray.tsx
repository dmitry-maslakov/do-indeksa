"use client";

import { cn } from "cn";
import type { MathfieldElement } from "mathlive";
import type { ReactNode, RefObject } from "react";
import type { AnswerSymbol } from "@/features/catalog/parts";

const named = (name: string) => ({ label: name, latex: `\\${name}`, name });

type Key = ReturnType<typeof named>;

const symbols = {
  root: { label: "√", latex: "\\sqrt{#0}", name: "sqrt" },
  pi: { label: "π", latex: "\\pi", name: "pi" },
  fraction: { label: "a/b", latex: "\\frac{#@}{#?}", name: "fraction" },
  power: { label: "xⁿ", latex: "#@^{#?}", name: "power" },
  log: { label: "log", latex: "\\log_{#?}{#?}", name: "log" },
  ln: named("ln"),
  trig: ["sin", "cos", "tg", "ctg"].map(named),
  arc: ["arcsin", "arccos", "arctg"].map(named),
};

export const functionSymbols: AnswerSymbol[] = ["log", "ln", "trig", "arc"];

export const symbolKeys = (present: AnswerSymbol[], ...names: AnswerSymbol[]) =>
  names
    .filter((name) => present.includes(name))
    .flatMap((name) => symbols[name]);

const keyStyle =
  "inline-flex h-8 min-w-9 items-center justify-center gap-1 rounded-lg bg-muted px-2.5 text-foreground text-sm outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring";

const keepFocus = (event: { preventDefault: () => void }) =>
  event.preventDefault();

export function TrayButton({
  onPress,
  label,
  round = false,
  math = false,
  children,
}: {
  onPress: () => void;
  label?: string;
  round?: boolean;
  math?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      onPointerDown={keepFocus}
      onClick={onPress}
      className={cn(
        keyStyle,
        math && "font-math text-base",
        round &&
          "size-8 min-w-8 rounded-full border-[1.5px] border-input border-dashed bg-transparent px-0 text-subtle",
      )}
    >
      {children}
    </button>
  );
}

interface SymbolTrayProps {
  keys: Key[];
  active: RefObject<MathfieldElement | null>;
  hint?: string;
  locked: boolean;
  children?: ReactNode;
}

export function SymbolTray({
  keys,
  active,
  hint,
  locked,
  children,
}: SymbolTrayProps) {
  if (locked) return null;
  return (
    <div className="invisible hidden min-h-8 flex-wrap items-center gap-1.5 group-focus-within/field:visible pointer-fine:flex">
      {children}
      {keys.map(({ label, latex, name }) => (
        <TrayButton
          key={name}
          math
          onPress={() => active.current?.insert(latex)}
        >
          {label}
        </TrayButton>
      ))}
      {hint && <span className="ml-auto text-subtle text-xs">{hint}</span>}
    </div>
  );
}
