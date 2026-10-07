"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { MathHtml } from "@/components/math-html";
import { type RevealPart, reveal } from "@/server/reveal";

interface RevealProps {
  label: string;
  taskId: string;
  part: RevealPart;
}

export function Reveal({ label, taskId, part }: RevealProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load(open: boolean) {
    if (!open || html !== null) return;
    startTransition(async () => setHtml(await reveal(taskId, part)));
  }

  return (
    <details
      className="group rounded-xl bg-muted px-4 py-3"
      onToggle={(e) => load(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-sm [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDownIcon className="size-4 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      {pending && (
        <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-untouched" />
      )}
      {html && <MathHtml html={html} className="mt-3" />}
    </details>
  );
}
