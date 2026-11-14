import { cn } from "cn";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  currentAdmission,
  type ProgramYear,
  resultYears,
  ruleGroups,
} from "@/features/admission/admissions";
import { Figure } from "@/features/admission/figure";
import type { Program } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";
import { SourceYears } from "./source-years";

const head =
  "border-b pb-2 text-right align-bottom font-medium text-muted-foreground text-xs";
const cell = "border-b py-2.5 text-right font-medium text-base";

type Bound = { over: number } | { atLeast: number };

async function Rules({
  program,
  years,
}: {
  program: Program;
  years: number[];
}) {
  const [t, facts, format] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
    getFormatter(),
  ]);
  const current = currentAdmission(program.faculty).year;
  const groups = ruleGroups(program.faculty).filter((g) =>
    g.years.some((y) => years.includes(y)),
  );

  return (
    <div className="space-y-1.5">
      {groups.map(({ value, years: span }) => {
        const present = span.includes(current);
        const unit = present ? "yes" : "no";
        const bound = (b: Bound) =>
          "over" in b
            ? t("bound", { kind: "over", points: format.number(b.over), unit })
            : t("bound", {
                kind: "atLeast",
                points: format.number(b.atLeast),
                unit,
              });
        const from = Math.min(...span);
        const to = Math.max(...span);
        return (
          <p key={from}>
            {t("rules", {
              tense: present ? "present" : "past",
              single: from === to ? "yes" : "no",
              from: facts.schoolYear(from),
              to: facts.schoolYear(to),
              budget: bound(value.budget),
              self: bound(value.self),
              exam:
                value.examMin === undefined
                  ? "none"
                  : format.number(value.examMin),
            })}
          </p>
        );
      })}
    </div>
  );
}

export async function CutoffsTable({
  program,
  history,
}: {
  program: Program;
  history: ProgramYear[];
}) {
  const [t, facts] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
  ]);
  const { short } = facultyOf(program.faculty);
  const current = currentAdmission(program.faculty);
  const rows = resultYears(history);
  const dashes = rows.filter(
    (y) => y.cutoff.budget === null || y.cutoff.self === null,
  );

  return (
    <div>
      <h3 className="mb-2 font-semibold text-base">{t("cutoffsTitle")}</h3>
      <table className="w-full table-fixed border-collapse tabular-nums">
        <caption className="caption-top pb-2.5 text-left text-[13px] text-muted-foreground">
          {t.rich("cutoffsCaption", {
            max: String(current.scoring.school.max + current.scoring.exam.max),
            link: (chunks) => (
              <Link
                href={`/${program.faculty}#bodovi`}
                className="whitespace-nowrap text-data hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </caption>
        <colgroup>
          <col className="w-28" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={cn(head, "text-left")}>
              {t("colYear")}
            </th>
            <th scope="col" className={head}>
              {t("budget")}
            </th>
            <th scope="col" className={head}>
              {t("self")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ year, cutoff }) => (
            <tr key={year}>
              <th
                scope="row"
                className="border-b py-2.5 text-left font-normal text-[15px] text-muted-foreground"
              >
                {t("schoolYear", { year: facts.schoolYear(year) })}
              </th>
              <td className={cell}>
                <Figure value={cutoff.budget} kind="score" short={short} />
              </td>
              <td className={cell}>
                <Figure value={cutoff.self} kind="score" short={short} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
        {dashes.map(({ year }) => (
          <p key={year}>{t("dashNote", { short, year: String(year) })}</p>
        ))}
        <Rules program={program} years={rows.map((y) => y.year)} />
        {!current.statistics && program.checked && (
          <p>
            {t("statisticsMissing", {
              year: String(current.year),
              short,
              date: facts.date(program.checked),
            })}
          </p>
        )}
        <SourceYears
          years={rows.toReversed().map(({ year, statistics }) => ({
            key: year,
            text: String(year),
            label: t("statisticsLabel", { short, year: String(year) }),
            url: statistics,
          }))}
          intro={(list) => t.rich("statisticsSources", { short, list })}
        />
      </div>
    </div>
  );
}
