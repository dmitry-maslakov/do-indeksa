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
  "aria-hidden"?: boolean;
}

function preloadFonts() {
  for (const font of fonts)
    preload(font.href, { as: "font", type: "font/woff2", crossOrigin: "" });
}

export function MathHtml({
  html,
  className,
  as: Tag = "div",
  ...aria
}: MathHtmlProps) {
  preloadFonts();
  return (
    <Tag
      {...aria}
      className={cn("math-text", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function KatexHtml({
  html,
  className,
}: Pick<MathHtmlProps, "html" | "className">) {
  preloadFonts();
  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
