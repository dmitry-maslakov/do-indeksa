import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { currentAdmission } from "@/features/admission/admissions";
import { facultyPrograms } from "@/features/admission/programs";
import { SourceLine } from "@/features/admission/source-line";
import { examRecord } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  AboutSection,
  actionClass,
  listClass,
  quietLink,
} from "./about-section";

const rowClass = "flex min-h-13 items-center py-3.5 font-medium";

export async function ProgramsSection({ examId }: { examId: string }) {
  const [t, facts] = await Promise.all([
    getTranslations("ExamAbout"),
    getFacts(),
  ]);
  const exam = examRecord(examId);
  const faculty = facultyOf(exam.faculty);
  const programs = facultyPrograms(faculty.id).filter((p) => p.exam === examId);
  const { year, scoring } = currentAdmission(faculty.id);

  return (
    <AboutSection
      id="smerovi"
      title={t("programsTitle", { exam: exam.title })}
      caption={t("programsCaption", {
        exam: exam.title,
        count: programs.length,
        schoolYear: facts.schoolYear(year),
        pages: programs.some((p) => p.checked) ? "yes" : "no",
      })}
    >
      <ul className={listClass}>
        {programs.map((program) => (
          <li key={program.slug}>
            {program.checked ? (
              <Link
                exam={null}
                locale={routing.defaultLocale}
                href={`/${faculty.id}/programs/${program.slug}`}
                className={cn("group", rowClass)}
              >
                <span className="min-w-0 flex-1 underline-offset-3 group-hover:underline">
                  {program.name}
                </span>
                <ChevronRightIcon
                  aria-hidden
                  className="ml-3 size-4 shrink-0 text-subtle group-hover:text-foreground"
                />
              </Link>
            ) : (
              <p className={rowClass}>{program.name}</p>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 text-[15px]">
        <p className="inline">
          {t("scoring", {
            schoolMin: String(scoring.school.min),
            schoolMax: String(scoring.school.max),
            examMin: String(scoring.exam.min),
            examMax: String(scoring.exam.max),
            max: String(scoring.school.max + scoring.exam.max),
          })}
        </p>{" "}
        <SourceLine
          faculty={faculty.id}
          refs={[{ cycle: year, section: scoring.section }]}
          linkClassName={quietLink}
          className="inline"
        />
      </div>
      <p className="mt-1 flex flex-col items-start lg:flex-row lg:items-center">
        <Link
          exam={null}
          locale={routing.defaultLocale}
          href={`/${faculty.id}#bodovi`}
          className={actionClass}
        >
          {t("scoringLink")}
        </Link>
        <span aria-hidden className="hidden px-2 text-subtle lg:inline">
          ·
        </span>
        <Link
          exam={null}
          locale={routing.defaultLocale}
          href={`/${faculty.id}#${exam.segment}`}
          className={actionClass}
        >
          {t("allPrograms", { short: faculty.short })}
        </Link>
      </p>
    </AboutSection>
  );
}
