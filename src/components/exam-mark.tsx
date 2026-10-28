import type { ReactNode } from "react";

export function ExamMark({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground before:size-2 before:rounded-xs before:bg-exam">
      {children}
    </span>
  );
}
