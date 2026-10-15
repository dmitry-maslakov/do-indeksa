import { escape as escapeHtml } from "es-toolkit";
import katex from "katex";
import { useMemo } from "react";
import { MathHtml } from "@/components/math-html";

interface MathPreviewProps {
  source: string;
  className?: string;
}

const toHtml = (part: string, index: number) =>
  index % 2
    ? katex.renderToString(part, { throwOnError: false })
    : escapeHtml(part);

export function MathPreview({ source, className }: MathPreviewProps) {
  const html = useMemo(
    () =>
      source
        .split(/\$([^$]+)\$/)
        .map(toHtml)
        .join(""),
    [source],
  );
  return <MathHtml as="span" html={html} className={className} />;
}
