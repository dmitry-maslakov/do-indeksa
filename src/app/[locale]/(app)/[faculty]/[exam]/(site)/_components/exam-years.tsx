import { useTranslations } from "next-intl";
import { examRecord } from "@/features/catalog/exams";
import { officialVariants } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

const shown = 8;

export function ExamYears({ examId }: { examId: string }) {
  const t = useTranslations("Home");
  const exams = officialVariants.slice(0, shown);
  const { about, title } = examRecord(examId);

  return (
    <section className="rounded-xl border bg-card px-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="font-semibold text-lg tracking-tight">{t("exams")}</h2>
        <div className="flex items-center gap-3 md:gap-4">
          {about && (
            <Link
              href="/about"
              data-intent={intentOf({ via: "exam_about" })}
              className="whitespace-nowrap font-medium text-subtle text-xs hover:text-foreground"
            >
              {t("aboutExam", { exam: title })}
            </Link>
          )}
          <Link
            href="/variants"
            className="whitespace-nowrap font-semibold text-data text-xs"
          >
            {t("allExams")}
          </Link>
        </div>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-none md:grid md:grid-cols-8">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/variants/${exam.id}`}
            data-intent={intentOf({ via: "exam_years" })}
            className="flex h-9 shrink-0 basis-17 items-center justify-center rounded-md bg-muted font-semibold text-xs"
          >
            {exam.year}
          </Link>
        ))}
      </div>
    </section>
  );
}
