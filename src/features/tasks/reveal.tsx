"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MathHtml } from "@/components/math-html";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorText } from "@/lib/use-error-text";
import { useHints } from "./hints";
import type { RevealPart } from "./reveal-part";
import { useReveal } from "./use-reveal";

interface RevealProps {
  label: string;
  taskId: string;
  part: RevealPart;
}

export function Reveal({ label, taskId, part }: RevealProps) {
  const [requested, setRequested] = useState(false);
  const {
    data: html,
    isFetching,
    isError,
    refetch,
  } = useReveal(taskId, part, requested);
  const t = useTranslations("Errors");
  const errorText = useErrorText();
  const hints = useHints();

  function open() {
    if (typeof part === "number") hints?.open(part);
    setRequested(true);
  }

  return (
    <details
      className="group rounded-xl bg-muted px-4 py-3"
      onToggle={(e) => e.currentTarget.open && open()}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-sm [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDownIcon className="size-4 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      {isFetching && <Skeleton className="mt-4 mb-1 h-3.5 w-2/3" />}
      {isError && !isFetching && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span role="alert" className="text-error-text">
            {errorText()}
          </span>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}
      {html && <MathHtml html={html} className="mt-3" />}
    </details>
  );
}
