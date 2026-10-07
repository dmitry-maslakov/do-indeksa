import "katex/dist/katex.min.css";
import { cn } from "cn";

interface MathHtmlProps {
  html: string;
  className?: string;
}

export function MathHtml({ html, className }: MathHtmlProps) {
  return (
    <div
      className={cn("math-text", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
