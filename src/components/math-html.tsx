import "katex/dist/katex.min.css";
import { cn } from "cn";

interface MathHtmlProps {
  html: string;
  className?: string;
  as?: "div" | "span";
}

export function MathHtml({ html, className, as: Tag = "div" }: MathHtmlProps) {
  return (
    <Tag
      className={cn("math-text", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
