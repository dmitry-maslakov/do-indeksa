import { cn } from "cn";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { type Ref, resolveRefs } from "./sources";

export const sourceLink =
  "underline decoration-1 decoration-input underline-offset-3 hover:decoration-current";

export const mutedSourceLink = `${sourceLink} hover:text-foreground`;

interface SourceLineProps {
  faculty: string;
  refs: Ref[];
  checked?: string;
  className?: string;
  linkClassName?: string;
  children?: ReactNode;
}

export async function SourceLine({
  faculty,
  refs,
  checked,
  className,
  linkClassName = sourceLink,
  children,
}: SourceLineProps) {
  const [t, facts, format] = await Promise.all([
    getTranslations("Facts"),
    getFacts(),
    getFormatter(),
  ]);
  const { short } = facultyOf(faculty);
  const sources = resolveRefs(faculty, refs);
  const mixed = sources.some((source) => source.kind === "cycle");
  const items = sources.map((source, i) =>
    source.kind === "cycle" ? (
      <span key={source.url + source.section}>
        <ExternalLink href={source.url} className={linkClassName}>
          {t("konkurs", { short, year: facts.schoolYear(source.year) })}
        </ExternalLink>
        {source.section &&
          t("section", {
            section: source.section,
            more: i < sources.length - 1 ? "yes" : "no",
          })}
      </span>
    ) : (
      <span key={source.title}>
        {t.rich("linkTitle", {
          mixed: mixed ? "yes" : "no",
          title: source.title,
          link: (chunks) => (
            <ExternalLink href={source.url} className={linkClassName}>
              {chunks}
            </ExternalLink>
          ),
        })}
      </span>
    ),
  );

  return (
    <p className={cn("text-[13px] text-subtle", className)}>
      {t.rich("sourceLine", {
        short,
        lead: sources[0]?.kind === "link" ? "yes" : "no",
        list: () => format.list(items),
      })}
      {checked && ` ${t("checkedOn", { date: facts.date(checked) })}`}
      {children && <> {children}</>}
    </p>
  );
}
