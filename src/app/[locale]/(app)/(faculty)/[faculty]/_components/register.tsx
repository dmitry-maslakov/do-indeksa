import { cn } from "cn";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  currentAdmission,
  latestResults,
  maxPoints,
} from "@/features/admission/admissions";
import {
  FilterGroup,
  NoResults,
  ProgramSearch,
  SearchField,
} from "@/features/admission/program-search";
import { facultyPrograms } from "@/features/admission/programs";
import { facultyExams } from "@/features/catalog/exams";
import { getFacts } from "@/i18n/facts";
import { fold } from "@/lib/text";
import { ExamGroup, type Group } from "./exam-group";
import { tracks } from "./program-row";

const caption = "lg:col-span-full lg:mb-1 lg:block lg:border-b lg:pb-1";
const unit = "hidden font-normal text-subtle lg:block";
const wide = (chunks: ReactNode) => (
  <span className="hidden lg:inline">{chunks}</span>
);

async function ColumnHead({ faculty }: { faculty: string }) {
  const [t, facts] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const current = currentAdmission(faculty);
  const results = latestResults(faculty);
  const places = facts.schoolYear(current.year);
  const year = results ? facts.schoolYear(results.year) : "";

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          tracks,
          "sticky top-0 z-2 border-y bg-background py-2 font-medium text-muted-foreground text-xs lg:items-end lg:text-right",
        )}
      >
        <div className="hidden text-left lg:block">{t("colProgram")}</div>
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
          <span className={caption}>{t("colPlaces", { year: places })}</span>
          <span className={unit}>{t("budget")}</span>
          <span className={unit}>{t("self")}</span>
        </div>
        <div>
          <span className={caption}>
            {t.rich("colTuition", { year: places, wide })}
          </span>{" "}
          <span className="lg:block lg:font-normal lg:text-subtle">
            {t.rich("colTuitionUnit", { wide })}
          </span>
        </div>
        {results && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
            <span className={caption}>
              {t.rich("colCutoffs", {
                year,
                max: String(maxPoints(current)),
                wide,
              })}
            </span>
            <span className={unit}>{t("budget")}</span>
            <span className={unit}>{t("self")}</span>
          </div>
        )}
      </div>
      <p className="border-b py-1.5 text-muted-foreground text-xs lg:py-2">
        {t("keyLine", { results: results ? "yes" : "no", year })}
      </p>
    </>
  );
}

export async function Register({ faculty }: { faculty: string }) {
  const t = await getTranslations("Faculty");
  const programs = facultyPrograms(faculty);
  const groups: Group[] = facultyExams(faculty)
    .map((exam) => {
      const own = programs.filter((p) => p.exam === exam.id);
      const keys = own.map((p) =>
        fold([p.name, p.short ?? "", ...p.aliases, exam.title].join(" ")),
      );
      return { exam, programs: own, keys };
    })
    .filter((group) => group.programs.length > 0);
  const open = groups.filter((g) => g.exam.open);
  const closed = groups.filter((g) => !g.exam.open);
  const all = groups.flatMap((g) => g.keys);
  const lead = (
    <>
      <FilterGroup keys={all}>
        <ColumnHead faculty={faculty} />
      </FilterGroup>
      <NoResults />
    </>
  );

  return (
    <ProgramSearch keys={all}>
      <SearchField controls="registar" className="mt-3 lg:mt-6 lg:w-90" />
      <div id="registar" className="lg:mt-2">
        {open.length === 0 && lead}
        {open.map((group, i) => (
          <ExamGroup
            key={group.exam.id}
            faculty={faculty}
            group={group}
            lead={i === 0 && lead}
          />
        ))}
        {closed.length > 0 && (
          <FilterGroup keys={closed.flatMap((g) => g.keys)}>
            <div className="pt-9">
              <h2 className="font-semibold text-lg tracking-normal">
                {t("others")}
              </h2>
              <p className="mt-0.5 text-[15px] text-muted-foreground">
                {t("othersNote")}
              </p>
            </div>
          </FilterGroup>
        )}
        {closed.map((group) => (
          <ExamGroup key={group.exam.id} faculty={faculty} group={group} />
        ))}
      </div>
    </ProgramSearch>
  );
}
