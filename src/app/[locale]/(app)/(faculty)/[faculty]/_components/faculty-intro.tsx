import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/page-title";
import { facultyPrograms } from "@/features/admission/programs";
import { facultyExams } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";

const jumpLink =
  "whitespace-nowrap text-data underline-offset-3 hover:underline";

export async function FacultyIntro({ faculty: id }: { faculty: string }) {
  const t = await getTranslations("Faculty");
  const faculty = facultyOf(id);
  const { short } = faculty;

  return (
    <div>
      <PageTitle size="lg">{t("title", { short })}</PageTitle>
      <p className="mt-1.5 text-balance text-[15px] text-muted-foreground">
        {t.rich("lead", {
          name: faculty.name,
          city: faculty.city,
          programs: facultyPrograms(id).length,
          exams: facultyExams(id).length,
          item: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
        })}
      </p>
      <nav
        aria-label={t("onPage")}
        className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-medium text-sm"
      >
        <a href="#bodovi" className={jumpLink}>
          {t("scoringTitle")}
        </a>
        <a href="#upis" className={jumpLink}>
          {t("admissionTitle", { short })}
        </a>
      </nav>
    </div>
  );
}
