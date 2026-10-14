"use client";

import "katex/dist/katex.min.css";
import { cn } from "cn";
import renderMathInElement from "katex/contrib/auto-render";
import { useCallback } from "react";

const delimiters = [{ left: "$", right: "$", display: false }];

interface MathPreviewProps {
  source: string;
  className?: string;
}

export function MathPreview({ source, className }: MathPreviewProps) {
  const render = useCallback(
    (element: HTMLSpanElement | null) => {
      if (!element) return;
      element.textContent = source;
      renderMathInElement(element, { delimiters, throwOnError: false });
    },
    [source],
  );

  return <span ref={render} className={cn("math-text", className)} />;
}
