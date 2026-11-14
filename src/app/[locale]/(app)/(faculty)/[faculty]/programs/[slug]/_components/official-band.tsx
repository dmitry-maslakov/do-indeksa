import { cn } from "cn";
import { compact } from "es-toolkit";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "@/components/external-link";
import { currentAdmission } from "@/features/admission/admissions";
import type { Program } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { Band } from "./band";

export async function OfficialBand({ program }: { program: Program }) {
  const [t, tf, facts] = await Promise.all([
    getTranslations("Program"),
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const { short, links } = facultyOf(program.faculty);
  const { year, konkurs } = currentAdmission(program.faculty);
  const list = compact([
    { title: t("page"), url: program.links.page },
    program.links.planPdf && {
      title: t("planPdf"),
      url: program.links.planPdf,
    },
    {
      title: tf("konkursLink", {
        year: facts.schoolYear(year),
        pdf: konkurs.toLowerCase().endsWith(".pdf") ? "yes" : "no",
      }),
      url: konkurs,
    },
    links.statistics,
    links.application,
  ]);

  return (
    <Band name="official" title={t("officialTitle", { short })}>
      <ul className="mb-3 lg:flex lg:flex-wrap lg:gap-x-6 lg:gap-y-1">
        {list.map((link, i) => (
          <li key={link.url}>
            <ExternalLink
              href={link.url}
              className={cn(
                "flex min-h-11 items-center gap-1 border-b text-[15px] text-data underline-offset-3 hover:underline lg:min-h-0 lg:border-0",
                i === 0 && "border-t",
              )}
            >
              {link.title}
            </ExternalLink>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted-foreground">
        {t("checked", { date: facts.date(program.checked) })}
      </p>
    </Band>
  );
}
