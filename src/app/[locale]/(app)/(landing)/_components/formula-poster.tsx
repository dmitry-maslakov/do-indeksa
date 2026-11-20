import { cn } from "cn";
import { MathHtml } from "@/components/math-html";
import { renderMarkdown } from "@/lib/markdown";

interface Formula {
  tex: string;
  className: string;
}

const formulas: Formula[] = [
  {
    tex: String.raw`\log_a b`,
    className:
      "top-2.5 left-[calc(-40*var(--g))] text-[length:calc(130*var(--g))] text-tone-blue",
  },
  {
    tex: "z=a+bi",
    className:
      "top-57 left-[calc(30*var(--g))] text-[length:calc(52*var(--g))] text-tone-pink max-xl:hidden",
  },
  {
    tex: "n!",
    className:
      "top-75 left-[calc(80*var(--g))] text-[length:calc(230*var(--g))] text-tone-orange",
  },
  {
    tex: String.raw`\int_0^1 x\,dx=\tfrac12`,
    className:
      "top-140 left-[calc(-20*var(--g))] text-[length:calc(60*var(--g))] text-tone-cyan",
  },
  {
    tex: String.raw`\sin^2 x+\cos^2 x=1`,
    className:
      "top-5 left-[calc(100%-336*var(--g))] text-[length:calc(96*var(--g))] text-tone-pink",
  },
  {
    tex: String.raw`\vec a\cdot\vec b=|\vec a|\,|\vec b|\cos\varphi`,
    className:
      "top-40 left-[calc(100%-348*var(--g))] text-[length:calc(50*var(--g))] text-tone-blue max-xl:hidden",
  },
  {
    tex: String.raw`\binom{n}{k}`,
    className:
      "top-59 left-[calc(100%-250*var(--g))] text-[length:calc(130*var(--g))] text-tone-yellow",
  },
  {
    tex: "a^2+b^2=c^2",
    className:
      "top-117.5 left-[calc(100%-348*var(--g))] text-[length:calc(50*var(--g))] text-tone-orange max-xl:hidden",
  },
  {
    tex: String.raw`a_n=a_1q^{\,n-1}`,
    className:
      "top-135 left-[calc(100%-370*var(--g))] text-[length:calc(84*var(--g))] text-tone-cyan",
  },
];

async function FormulaView({ tex, className }: Formula) {
  const html = await renderMarkdown(`$${tex}$`, "landing formulas");

  return (
    <MathHtml
      html={html}
      className={cn(
        "absolute overflow-visible whitespace-nowrap leading-none",
        className,
      )}
    />
  );
}

export function FormulaPoster() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 inset-x-[calc(50%-50vw)] -z-10 hidden select-none overflow-x-clip [--g:clamp(.45px,calc((100vw-680px)/760),1.15px)] lg:block"
    >
      {formulas.map((formula) => (
        <FormulaView key={formula.tex} {...formula} />
      ))}
    </div>
  );
}
