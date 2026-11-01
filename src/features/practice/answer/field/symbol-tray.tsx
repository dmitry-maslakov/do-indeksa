"use client";

import { cn } from "cn";
import type { MathfieldElement } from "mathlive";
import type { ReactNode, RefObject } from "react";

export const symbols = {
  root: { label: "√", latex: "\\sqrt{#0}", name: "sqrt" },
  pi: { label: "π", latex: "\\pi", name: "pi" },
  fraction: { label: "a/b", latex: "\\frac{#@}{#?}", name: "fraction" },
  power: { label: "xⁿ", latex: "#@^{#?}", name: "power" },
  log: { label: "log", latex: "\\log_{#?}{#?}", name: "log" },
  infinity: { label: "∞", latex: "\\infty", name: "infinity" },
} as const;

type Key = (typeof symbols)[keyof typeof symbols];

const keyStyle =
  "inline-flex h-8 min-w-9 items-center justify-center gap-1 rounded-lg bg-muted px-2.5 font-math text-foreground text-sm outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring";

const keepFocus = (event: { preventDefault: () => void }) =>
  event.preventDefault();

export function TrayButton({
  onPress,
  label,
  round = false,
  children,
}: {
  onPress: () => void;
  label?: string;
  round?: boolean;
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
  hint: string;
  children?: ReactNode;
}

export function SymbolTray({ keys, active, hint, children }: SymbolTrayProps) {
  return (
    <div className="hidden min-h-8 flex-wrap items-center gap-1.5 pointer-fine:flex invisible group-focus-within/field:visible">
      {children}
      {keys.map(({ label, latex, name }) => (
        <TrayButton key={name} onPress={() => active.current?.insert(latex)}>
          {label}
        </TrayButton>
      ))}
      <span className="ml-auto text-subtle text-xs">{hint}</span>
    </div>
  );
}
