"use client";

import { cn } from "cn";
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

function RevealError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Errors");
  const errorText = useErrorText();
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span role="alert" className="text-error-text">
        {errorText()}
      </span>
      <Button size="sm" variant="ghost" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

export function RevealContent({ taskId, part, className }: RevealContentProps) {
  const { data, isFetching, isError, refetch } = useReveal(taskId, part);

  if (isFetching) return <Skeleton className="my-1 h-4 w-2/3" />;
  if (isError) return <RevealError onRetry={() => refetch()} />;
  return data?.html ? (
    <MathHtml html={data.html} className={className} />
  ) : null;
}

interface RevealSolutionProps {
  taskId: string;
  testSessionId: string;
  label: string;
  className?: string;
}

export function RevealSolution({
  taskId,
  testSessionId,
  label,
  className,
}: RevealSolutionProps) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  function toggle() {
    if (!seen) {
      saveReveal({
        taskId,
        part: "solution",
        owner: { testSessionId },
      }).catch(noop);
      setSeen(true);
    }
    setOpen(!open);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={toggle}
        className="self-start aria-expanded:bg-card aria-expanded:ring-[1.5px] aria-expanded:ring-foreground aria-expanded:ring-inset"
      >
        {label}
        <ChevronDownIcon className="text-subtle transition-transform group-aria-expanded/button:rotate-180" />
      </Button>
      {open && (
        <div className="rounded-xl bg-muted px-4 py-3 2xl:bg-transparent 2xl:p-0">
          <RevealContent taskId={taskId} part="solution" />
        </div>
      )}
    </div>
  );
}
