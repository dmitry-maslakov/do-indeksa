import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { tableGrid } from "./exam-row";
import { results, resultTone } from "./results";

interface TestsTableProps {
  first: "year" | "test" | "attempt";
  children: ReactNode;
}

export function TestsTable({ first, children }: TestsTableProps) {
  const t = useTranslations("Variants");

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div
          aria-hidden
          className={cn(
            "grid h-10 items-center border-b text-subtle text-xs max-md:hidden",
            tableGrid,
          )}
        >
          <span>{t(first)}</span>
          <span>{t("cells")}</span>
          <span className="text-right">{t("points")}</span>
        </div>
        <ul>{children}</ul>
      </div>
      <div className="flex gap-4 px-1 text-subtle text-xs">
        {results.map((result) => (
          <span key={result} className="inline-flex items-center gap-2">
            <i className={cn("size-3 rounded-xs", resultTone[result])} />
            {t(`result.${result}`)}
          </span>
        ))}
      </div>
    </>
  );
}
