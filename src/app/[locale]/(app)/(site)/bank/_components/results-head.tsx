"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowserEvents } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";

interface ResultsHeadProps {
  count: number;
  label: string;
  shown?: BrowserEvents["bank_results_shown"];
  pending?: boolean;
}

export function ResultsHead({
  count,
  label,
  shown,
  pending,
}: ResultsHeadProps) {
  const t = useTranslations("Bank");
  const seen = useExposure("bank_results_shown", shown);
  return (
    <div
      ref={seen}
      className="flex items-center justify-between gap-3 px-1 lg:px-0"
    >
      {pending ? (
        <Skeleton className="my-1 h-4 w-24" />
      ) : (
        <span className="shrink-0 font-semibold text-base lg:font-normal">
          {t("count", { count })}
        </span>
      )}
      <span className="truncate text-sm text-subtle lg:hidden">{label}</span>
    </div>
  );
}
