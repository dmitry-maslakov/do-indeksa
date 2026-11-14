import { cn } from "cn";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { type Ref, resolveRefs } from "./sources";

export const sourceLink =
  "underline decoration-1 decoration-input underline-offset-3 hover:decoration-current";

interface SourceLineProps {
  faculty: string;
  refs: Ref[];
  checked?: string;
  className?: string;
  children?: ReactNode;
}

export async function SourceLine({
  faculty,
  refs,
  checked,
  className,
  children,
}: SourceLineProps) {
  const [t, facts, format] = await Promise.all([
    getTranslations("Facts"),
    getFacts(),
    getFormatter(),
  ]);
  const { short } = facultyOf(faculty);
  const items = resolveRefs(faculty, refs).map((source) =>
    source.kind === "cycle" ? (
      <span key={source.url + source.section}>
        <ExternalLink href={source.url} className={sourceLink}>
          {t("konkurs", { short, year: facts.schoolYear(source.year) })}
        </ExternalLink>
        {source.section && t("section", { section: source.section })}
      </span>
    ) : (
      <ExternalLink key={source.title} href={source.url} className={sourceLink}>
        {source.title}
      </ExternalLink>
    ),
  );

  return (
    <p className={cn("text-[13px] text-subtle", className)}>
      {t.rich("sourceLine", {
        count: items.length,
        list: () => format.list(items),
      })}
      {checked && ` ${t("checkedOn", { date: facts.date(checked) })}`}
      {children && <> {children}</>}
    </p>
  );
}
