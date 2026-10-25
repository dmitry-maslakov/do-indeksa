import "katex/dist/katex.min.css";
import { cn } from "cn";
import { preload } from "react-dom";

const fonts = [
  new URL("katex/dist/fonts/KaTeX_Main-Regular.woff2", import.meta.url),
  new URL("katex/dist/fonts/KaTeX_Math-Italic.woff2", import.meta.url),
  new URL("katex/dist/fonts/KaTeX_Main-Italic.woff2", import.meta.url),
];

interface MathHtmlProps {
  html: string;
  className?: string;
  as?: "div" | "span";
}

export function MathHtml({ html, className, as: Tag = "div" }: MathHtmlProps) {
  for (const font of fonts)
    preload(font.href, { as: "font", type: "font/woff2", crossOrigin: "" });

  return (
    <Tag
      className={cn("math-text", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
