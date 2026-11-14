import { cn } from "cn";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  currentAdmission,
  latestResults,
  maxPoints,
} from "@/features/admission/admissions";
import { FilterGroup } from "@/features/admission/program-search";
import type { facultyPrograms } from "@/features/admission/programs";
import { ExamBadge } from "@/features/catalog/exam-badge";
import type { facultyExams } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { ProgramRow } from "./program-row";

export interface Group {
  exam: ReturnType<typeof facultyExams>[number];
  programs: ReturnType<typeof facultyPrograms>;
  keys: string[];
}

async function ExamHead({
  exam,
  open,
}: {
  exam: Group["exam"];
  open: boolean;
}) {
  const t = await getTranslations("Faculty");
  const Heading = open ? "h2" : "h3";
  const hours = (exam.minutes ?? 0) / 60;
  const composition =
    exam.positions.length > 0
      ? t("composition", {
          tasks: exam.positions.length,
          hours,
          points: String(exam.points),
        })
      : exam.minutes
        ? t("summaryTimed", {
            summary: exam.summary ?? "",
            hours,
            points: String(exam.points),
          })
        : exam.summary;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 pt-4 pb-2.5",
        open
          ? "lg:items-center lg:gap-x-6 lg:pt-7 lg:pb-4"
          : "border-b lg:pt-6 lg:pb-3.5",
      )}
    >
      <Heading
        id={`h-${exam.segment}`}
        title={exam.officialName}
        className={cn(
          "col-start-1 flex items-baseline gap-2.5 tracking-normal",
          open ? "font-semibold text-lg" : "font-medium text-base",
        )}
      >
        <ExamBadge exam={exam} size="dot" />
        {t("examLabel", { title: exam.title, name: exam.name })}
      </Heading>
      <p className="col-start-1 pl-4.5 text-balance text-[13px] text-muted-foreground">
        {composition}
      </p>
      {open && (
        <Button
          variant="lime"
          nativeButton={false}
          render={
            <Link
              exam={exam.path}
              href="/"
              data-intent={intentOf({ via: "faculty" })}
            />
          }
          className="col-start-2 row-span-2 row-start-1 self-center px-3 lg:px-4.5"
        >
          {t("practice", { exam: exam.title })}
        </Button>
      )}
    </div>
  );
}

export async function ExamGroup({
  faculty: id,
  group,
  lead,
}: {
  faculty: string;
  group: Group;
  lead?: ReactNode;
}) {
  const [t, facts] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const { short } = facultyOf(id);
  const current = currentAdmission(id);
  const results = latestResults(id);
  const { exam, programs, keys } = group;
  const year = results ? facts.schoolYear(results.year) : "";
  const max = String(maxPoints(current));
  const head = <ExamHead exam={exam} open={exam.open} />;

  return (
    <>
      {exam.open && <FilterGroup keys={keys}>{head}</FilterGroup>}
      {lead}
      <FilterGroup keys={keys}>
        <section
          id={exam.segment}
          aria-labelledby={`h-${exam.segment}`}
          className={
            exam.open
              ? "scroll-mt-42 lg:scroll-mt-46"
              : "scroll-mt-13 lg:scroll-mt-15"
          }
        >
          {!exam.open && head}
          <table className="block w-full">
            <caption className="sr-only">
              {t("caption", {
                exam: exam.title,
                places: facts.schoolYear(current.year),
                results: results ? "yes" : "no",
                year,
              })}
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">{t("colProgram")}</th>
                <th scope="col">
                  {t("thPlaces", { year: facts.schoolYear(current.year) })}
                </th>
                <th scope="col">
                  {t("thTuition", { year: facts.schoolYear(current.year) })}
                </th>
                <th scope="col">{t("thCutoffs", { year, max })}</th>
              </tr>
            </thead>
            <tbody className="block">
              {programs.map((program, i) => (
                <ProgramRow
                  key={program.slug}
                  faculty={id}
                  short={short}
                  searchKey={keys[i] ?? ""}
                  rank={i + 1}
                  program={program}
                  places={current.programs[program.slug]}
                  cutoff={results?.programs[program.slug]?.cutoff}
                />
              ))}
            </tbody>
          </table>
        </section>
      </FilterGroup>
    </>
  );
}
