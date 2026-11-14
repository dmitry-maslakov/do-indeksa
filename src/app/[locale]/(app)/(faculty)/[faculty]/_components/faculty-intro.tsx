import { cn } from "cn";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "@/components/external-link";
import { PageTitle } from "@/components/page-title";
import {
  currentAdmission,
  latestResults,
} from "@/features/admission/admissions";
import { facultyPrograms } from "@/features/admission/programs";
import { sourceLink } from "@/features/admission/source-line";
import { facultyExams } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";

const jumpLink =
  "ml-3.5 whitespace-nowrap text-data underline-offset-3 hover:underline";

export async function FacultyIntro({ faculty: id }: { faculty: string }) {
  const [t, facts] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const faculty = facultyOf(id);
  const { short } = faculty;
  const current = currentAdmission(id);
  const results = latestResults(id);
  const metaLink = cn(sourceLink, "text-muted-foreground");

  return (
    <div>
      <PageTitle>{t("title", { short })}</PageTitle>
      <p className="mt-1.5">
        {t("lead", {
          name: faculty.name,
          cityLocative: faculty.cityLocative,
          programs: facultyPrograms(id).length,
          exams: facultyExams(id).length,
        })}
      </p>
      <div className="mt-1 text-[13px] text-subtle">
        <p className="inline">
          {t.rich("sources", {
            short,
            year: facts.schoolYear(current.year),
            results: results ? "yes" : "no",
            resultsYear: String(results?.year ?? ""),
            checked: faculty.checked ? "yes" : "no",
            date: faculty.checked ? facts.date(faculty.checked) : "",
            konkurs: (chunks) => (
              <ExternalLink href={current.konkurs} className={metaLink}>
                {chunks}
              </ExternalLink>
            ),
            statistics: (chunks) => (
              <ExternalLink href={results?.statistics} className={metaLink}>
                {chunks}
              </ExternalLink>
            ),
          })}{" "}
          {t("unofficial", { short })}
        </p>
        <nav aria-label={t("onPage")} className="inline font-medium">
          <a href="#bodovi" className={jumpLink}>
            {t("scoringTitle")}
          </a>
          <a href="#upis" className={jumpLink}>
            {t("admissionTitle", { short })}
          </a>
        </nav>
      </div>
    </div>
  );
}
