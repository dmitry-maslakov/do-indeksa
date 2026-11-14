import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { segmentTone } from "@/components/segment-tone";
import { tableGrid } from "./exam-row";

const legend = ["done", "partial", "error"] as const;

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
        {legend.map((segment) => (
          <span key={segment} className="inline-flex items-center gap-2">
            <i className={cn("size-3 rounded-xs", segmentTone[segment].chip)} />
            {t(`result.${segment}`)}
          </span>
        ))}
      </div>
    </>
  );
}
