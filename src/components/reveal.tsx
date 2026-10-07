import { ChevronDownIcon } from "lucide-react";
import { MathHtml } from "@/components/math-html";

interface RevealProps {
  label: string;
  html: string;
}

export function Reveal({ label, html }: RevealProps) {
  return (
    <details className="group rounded-xl bg-muted px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-sm [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDownIcon className="size-4 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      <MathHtml html={html} className="mt-3" />
    </details>
  );
}
