import { useTranslations } from "next-intl";
import { officialVariants } from "@/features/exam/variants";
import { Link } from "@/i18n/navigation";

const shown = 8;

export function ExamYears() {
  const t = useTranslations("Home");
  const exams = officialVariants.slice(0, shown);

  return (
    <section className="rounded-xl border bg-card px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-lg tracking-tight">{t("exams")}</h2>
        <Link
          href="/variants"
          className="whitespace-nowrap font-semibold text-data text-xs"
        >
          {t("allExams")}
        </Link>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-none md:grid md:grid-cols-8">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/variants/${exam.id}`}
            className="flex h-9 shrink-0 basis-17 items-center justify-center rounded-md bg-muted font-semibold text-xs"
          >
            {exam.year}
          </Link>
        ))}
      </div>
    </section>
  );
}
