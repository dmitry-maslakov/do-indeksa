"use client";

import { cn } from "cn";
import type { MathfieldElement } from "mathlive";
import type { ReactNode, RefObject } from "react";
import { type AnswerSymbol, answerSymbols } from "@/features/catalog/symbols";

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
  symbols: AnswerSymbol[];
  active: RefObject<MathfieldElement | null>;
  hint?: string;
  locked: boolean;
  children?: ReactNode;
}

export function SymbolTray({
  symbols,
  active,
  hint,
  locked,
  children,
}: SymbolTrayProps) {
  if (locked || (!symbols.length && !children && !hint)) return null;
  return (
    <div className="invisible hidden min-h-8 flex-wrap items-center gap-1.5 group-focus-within/field:visible pointer-fine:flex">
      {children}
      {symbols.map((name) => (
        <TrayButton
          key={name}
          math
          onPress={() => active.current?.insert(answerSymbols[name].latex)}
        >
          {answerSymbols[name].label}
        </TrayButton>
      ))}
      {hint && <span className="ml-auto text-subtle text-xs">{hint}</span>}
    </div>
  );
}
