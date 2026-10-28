import type { ReactNode } from "react";

export function FilterLabel({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span aria-hidden="true" className="text-muted-foreground text-xs">
        {text}
      </span>
      {children}
    </div>
  );
}
