import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

const tags = {
  ok: (chunks: ReactNode) => (
    <span className="text-success-text">{chunks}</span>
  ),
};

interface VisitHeaderProps {
  done: number;
  right: number;
  scrolled: boolean;
}

export function VisitHeader({ done, right, scrolled }: VisitHeaderProps) {
  const t = useTranslations("Solve");
  return (
    <div
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-2 h-8 bg-muted pt-3 pb-1 pl-8 font-medium text-subtle text-xs leading-4 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-linear-to-b after:from-muted after:to-transparent after:opacity-0 after:transition-opacity data-scrolled:after:opacity-100 group-data-[variant=sheet]/rail:bg-card group-data-[variant=sheet]/rail:after:from-card"
    >
      {done > 0 && t.rich("visitSummary", { done, right, ...tags })}
    </div>
  );
}
