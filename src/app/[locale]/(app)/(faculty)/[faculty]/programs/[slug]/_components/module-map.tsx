import { cn } from "cn";
import { range } from "es-toolkit";
import { getFormatter, getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { MathHtml } from "@/components/math-html";
import type { Program } from "@/features/admission/programs";
import { renderMarkdown } from "@/lib/markdown";

const year =
  "col-start-1 pt-3 font-medium text-[13px] text-muted-foreground leading-4.5 lg:pr-3";
const plate = "overflow-hidden bg-muted font-medium text-[15px] leading-5";
const plateLink =
  "flex h-full items-center px-3.5 py-3 underline-offset-3 hover:bg-untouched hover:underline";

export async function ModuleMap({ program }: { program: Program }) {
  const [t, format] = await Promise.all([
    getTranslations("Program"),
    getFormatter(),
  ]);
  const choice = program.choice
    ? await renderMarkdown(program.choice, program.id)
    : "";
  const { modules, modulesFrom, moduleIds, years } = program;

  if (!modulesFrom || modules.length === 0)
    return (
      choice && (
        <MathHtml html={choice} className="text-[15px] leading-normal" />
      )
    );

  const label = (from: number, to: number) =>
    t("yearsLabel", {
      years: format.list(range(from, to + 1).map((n) => `${n}.`)),
    });

  return (
    <figure
      style={{ "--n": modules.length } as CSSProperties}
      className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-6"
    >
      <figcaption className="lg:col-span-3 lg:pt-2.5">
        <MathHtml html={choice} className="text-[15px] leading-normal" />
      </figcaption>
      <dl className="mt-3 grid grid-cols-[--spacing(17)_minmax(0,1fr)] gap-x-2 gap-y-0.5 lg:col-span-9 lg:col-start-4 lg:mt-0 lg:grid-cols-[--spacing(28)_repeat(var(--n),minmax(0,1fr))] lg:gap-x-0.5">
        <dt className={cn(year, "row-start-1")}>{label(1, modulesFrom - 1)}</dt>
        <dd
          className={cn(
            plate,
            "col-start-2 row-start-1 rounded-xl lg:-col-end-1 lg:rounded-b-none",
          )}
        >
          <a
            href="#predmeti"
            className={cn(plateLink, "min-h-11 text-muted-foreground")}
          >
            {t("shared")}
          </a>
        </dd>
        <dt className={cn(year, "row-[2/span_var(--n)] mt-2 lg:row-2 lg:mt-0")}>
          {label(modulesFrom, years)}
        </dt>
        {modules.map((module, i) => (
          <dd
            key={module.name}
            className={cn(
              plate,
              "col-start-2 lg:col-start-auto lg:row-start-2",
              i === 0 &&
                "mt-2 rounded-t-xl lg:mt-0 lg:rounded-t-none lg:rounded-bl-xl",
              i > 0 && i === modules.length - 1 && "lg:rounded-bl-none",
              i === modules.length - 1 && "rounded-b-xl lg:rounded-br-xl",
            )}
          >
            <a
              href={`#${moduleIds[i]}`}
              className={cn(plateLink, "min-h-13 lg:min-h-16 lg:items-start")}
            >
              {module.name}
            </a>
          </dd>
        ))}
      </dl>
    </figure>
  );
}
