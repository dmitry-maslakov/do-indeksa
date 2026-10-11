import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { MathHtml } from "@/components/math-html";
import { examTitle, positions } from "@/content/exam";
import { topicName } from "@/content/topics";
import { latexToHtml } from "@/lib/latex";

const formulas: Record<string, string> = {
  "complex-numbers": "z=-3+3\\sqrt{3}\\,i",
  "quadratic-equations": "x^{2}-mx+3=0",
  logarithms: "\\log_{2} x+\\log_{x} 2=\\frac{5}{2}",
  "exponential-equations": "4^{x}-3\\cdot 2^{x}-4=0",
  trigonometry: "2\\sin\\!\\left(x-\\frac{\\pi}{6}\\right)=\\sqrt{3}",
  "vectors-analytic-geometry":
    "\\overrightarrow{AB}\\times\\overrightarrow{AC}",
  "plane-geometry": "d_1^2+d_2^2=4a^2",
  "solid-geometry": "6a^2=a^3",
  "functions-integrals": "f(x)=\\frac{x^2+2}{x+1}",
  combinatorics: "5\\cdot 5\\cdot 4\\cdot 3=300",
};

export function ExamSheet() {
  const t = useTranslations("Launch");
  const locale = useLocale();

  return (
    <figure className="relative isolate self-center rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 before:pointer-events-none before:absolute before:inset-0 before:z-10 before:animate-sweep before:rounded-[inherit] before:bg-[linear-gradient(100deg,transparent_40%,--alpha(var(--color-data-soft)/22%)_50%,transparent_60%)] before:bg-size-[250%_100%] before:bg-no-repeat motion-reduce:before:hidden md:col-start-2 md:row-span-3 md:row-start-1 md:p-6">
      <figcaption className="flex items-baseline justify-between gap-3 border-white/10 border-b pb-3 text-[13px]">
        <span className="shrink-0 font-semibold">{examTitle}</span>
        <span className="text-right text-daily-muted">
          {t("sheet", { count: positions.length })}
        </span>
      </figcaption>
      <ol className="grid gap-x-6 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5">
        {positions.map((p, index) => (
          <li
            key={p.topic}
            style={{ "--i": index } as CSSProperties}
            className="grid animate-assemble grid-cols-[1.5rem_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1 border-white/10 border-b border-dashed py-2.5 motion-reduce:animate-none"
          >
            <span className="font-bold text-data-soft tabular-nums">
              {p.number}
            </span>
            <span className="text-daily-muted text-xs">
              {topicName(p.topic, locale)}
            </span>
            <MathHtml
              as="span"
              html={latexToHtml(formulas[p.topic] ?? "")}
              className="col-start-2 text-sm"
            />
          </li>
        ))}
      </ol>
    </figure>
  );
}
