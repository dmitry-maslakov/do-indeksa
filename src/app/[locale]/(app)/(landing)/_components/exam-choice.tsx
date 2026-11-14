import { mapValues } from "es-toolkit";
import { ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ExamBadge } from "@/features/catalog/exam-badge";
import { type ExamGroup, examGroups } from "@/features/catalog/exams";
import { officialYears } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

interface ExamButtonProps {
  exam: ExamGroup["exams"][number];
  faculty: ExamGroup;
  rank: number;
}

function ExamButton({ exam, faculty, rank }: ExamButtonProps) {
  const t = useTranslations("Landing");
  const years = officialYears(exam.id);
  const place = { faculty: faculty.short, city: faculty.city };

  return (
    <Link
      exam={exam.path}
      href="/"
      data-intent={intentOf({ via: "landing_exam", rank })}
      className="group flex min-h-19 items-center gap-3 rounded-3xl bg-muted py-3 pr-3 pl-2.5 outline-none transition-colors hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring md:h-21 md:w-115 md:gap-3.5 md:px-3.5 md:text-left"
    >
      <ExamBadge exam={exam} size="md" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-0">
        <span className="font-semibold text-base leading-[21px] md:text-[17px] md:leading-[23px]">
          {exam.name}
        </span>
        <span className="font-medium text-[13px] leading-4.5 md:text-sm md:leading-5">
          {years
            ? t.rich("placeYears", {
                ...place,
                ...mapValues(years, String),
                whole: (chunks) => (
                  <span className="whitespace-nowrap">{chunks}</span>
                ),
              })
            : t("place", place)}
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
  const groups = examGroups(useLocale());
  const [faculty] = groups;
  const exams = groups.flatMap((group) =>
    group.exams.map((exam) => ({ exam, faculty: group })),
  );

  return (
    <>
      <p className="mt-8 font-semibold text-[17px] leading-6 md:mt-12 md:text-lg md:leading-6.5">
        {t("choose")}
      </p>
      <div className="mt-3 flex flex-col gap-2 md:mt-4 md:w-full md:max-w-234 md:flex-row md:flex-wrap md:justify-center md:gap-x-4 md:gap-y-3">
        {exams.map(({ exam, faculty }, i) => (
          <ExamButton
            key={exam.id}
            exam={exam}
            faculty={faculty}
            rank={i + 1}
          />
        ))}
      </div>
      {faculty && (
        <Link
          exam={null}
          href={`/${faculty.id}`}
          data-intent={intentOf({ via: "landing_programs" })}
          className="mt-4 rounded-sm font-medium text-[15px] text-data outline-none focus-visible:ring-2 focus-visible:ring-ring md:mt-5 md:text-base"
        >
          {t("byProgram")}
        </Link>
      )}
    </>
  );
}
