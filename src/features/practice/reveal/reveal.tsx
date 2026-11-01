"use client";

import { noop } from "es-toolkit";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
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

interface RevealSwitchProps {
  taskId: string;
  testSessionId: string;
  parts: { part: RevealPart; label: string }[];
  children?: ReactNode;
}

export function RevealSwitch({
  taskId,
  testSessionId,
  parts,
  children,
}: RevealSwitchProps) {
  const [open, setOpen] = useState<RevealPart | null>(null);
  const [seen, setSeen] = useState<RevealPart[]>([]);

  function toggle(part: RevealPart) {
    if (!seen.includes(part)) {
      saveReveal({ taskId, part, owner: { testSessionId } }).catch(noop);
      setSeen([...seen, part]);
    }
    setOpen(open === part ? null : part);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {parts.map(({ part, label }) => (
          <Button
            key={part}
            variant="ghost"
            size="sm"
            aria-expanded={open === part}
            onClick={() => toggle(part)}
            className="aria-expanded:bg-card aria-expanded:ring-[1.5px] aria-expanded:ring-foreground aria-expanded:ring-inset"
          >
            {label}
            <ChevronDownIcon className="text-subtle transition-transform group-aria-expanded/button:rotate-180" />
          </Button>
        ))}
        {children}
      </div>
      {open !== null && (
        <div className="rounded-xl bg-muted px-4 py-3">
          <RevealContent taskId={taskId} part={open} />
        </div>
      )}
    </div>
  );
}
