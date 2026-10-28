"use client";

import { noop } from "es-toolkit";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MathHtml } from "@/components/math-html";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { saveReveal } from "@/features/practice/actions";
import { useErrorText } from "@/lib/use-error-text";
import type { RevealPart } from "./reveals";
import { useReveal } from "./use-reveal";

interface RevealContentProps {
  taskId: string;
  part: RevealPart;
  className?: string;
}

export function RevealContent({ taskId, part, className }: RevealContentProps) {
  const { data: html, isFetching, isError, refetch } = useReveal(taskId, part);
  const t = useTranslations("Errors");
  const errorText = useErrorText();

  if (isFetching) return <Skeleton className="my-1 h-4 w-2/3" />;
  if (isError) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span role="alert" className="text-error-text">
          {errorText()}
        </span>
        <Button size="sm" variant="ghost" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  return html ? <MathHtml html={html} className={className} /> : null;
}

interface RevealProps {
  label: string;
  taskId: string;
  testSessionId: string;
  part: RevealPart;
}

export function Reveal({ label, taskId, testSessionId, part }: RevealProps) {
  const [requested, setRequested] = useState(false);

  function open() {
    if (!requested)
      saveReveal({ taskId, part, owner: { testSessionId } }).catch(noop);
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
      {requested && (
        <div className="mt-3">
          <RevealContent taskId={taskId} part={part} />
        </div>
      )}
    </details>
  );
}
