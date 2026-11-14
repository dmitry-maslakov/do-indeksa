import { ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ExamBadge } from "@/features/catalog/exam-badge";
import { examChoice, examLabel, openFaculties } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { officialYears } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

type Exam = (typeof examChoice)[number];

function ExamButton({ exam, rank }: { exam: Exam; rank: number }) {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const faculty = facultyOf(exam.faculty);
  const years = officialYears(exam.id);
  const place = t("place", { faculty: faculty.short, city: faculty.city });

  return (
    <Link
      exam={exam.path}
      href="/"
      data-intent={intentOf({ via: "landing_exam", rank })}
      className="group flex min-h-19 items-center gap-3 rounded-3xl bg-muted py-3 pr-3 pl-2.5 transition-colors hover:bg-untouched md:h-21 md:w-115 md:gap-3.5 md:px-3.5 md:text-left"
    >
      <ExamBadge exam={exam} size="md" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-0">
        <span className="font-semibold text-base leading-[21px] md:text-[17px] md:leading-[23px]">
          {examLabel(exam, locale)}
        </span>
        <span className="font-medium text-[13px] leading-4.5 md:text-sm md:leading-5">
          {years
            ? `${place} · ${t("years", {
                first: String(years.first),
                last: String(years.last),
              })}`
            : place}
        </span>
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card font-semibold text-[15px] leading-5 md:w-auto md:gap-2 md:pr-3 md:pl-4">
        <span className="max-md:sr-only">{t("start")}</span>
        <ArrowRightIcon
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

export function ExamChoice() {
  const t = useTranslations("Landing");
  const [faculty] = openFaculties;

  return (
    <>
      <p className="mt-8 font-semibold text-[17px] leading-6 md:mt-12 md:text-lg md:leading-6.5">
        {t("choose")}
      </p>
      <div className="mt-3 flex flex-col gap-2 md:mt-4 md:w-full md:max-w-234 md:flex-row md:flex-wrap md:justify-center md:gap-x-4 md:gap-y-3">
        {examChoice.map((exam, i) => (
          <ExamButton key={exam.id} exam={exam} rank={i + 1} />
        ))}
      </div>
      {faculty && (
        <Link
          exam={null}
          href={`/${faculty.id}`}
          data-intent={intentOf({ via: "landing_programs" })}
          className="mt-4 font-medium text-[15px] text-data md:mt-5 md:text-base"
        >
          {t("byProgram")}
        </Link>
      )}
    </>
  );
}
