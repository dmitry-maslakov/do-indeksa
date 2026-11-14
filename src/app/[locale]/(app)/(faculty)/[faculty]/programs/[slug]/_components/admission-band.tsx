import { compact } from "es-toolkit";
import { getFormatter, getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import {
  currentAdmission,
  type ProgramYear,
  programHistory,
  type Run,
  resultYears,
  runs,
} from "@/features/admission/admissions";
import type { Program } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { renderMarkdown } from "@/lib/markdown";
import { Band } from "./band";
import { CutoffsTable } from "./cutoffs-table";
import { SourceYears } from "./source-years";

const under = "mt-3 space-y-1.5 text-[13px] text-muted-foreground";
const fact = "border-t py-2 last:border-b";

async function MoneyFacts({
  program,
  history,
}: {
  program: Program;
  history: ProgramYear[];
}) {
  const [t, facts, format] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
    getFormatter(),
  ]);
  const { short } = facultyOf(program.faculty);
  const { fees } = currentAdmission(program.faculty);
  const school = (year: number) =>
    t("schoolYear", { year: facts.schoolYear(year) });
  const years = (list: number[]) => format.list(list.toSorted().map(school));
  const sentence = <T,>(
    list: Run<T>[],
    newest: (value: T) => string,
    older: (value: T) => string,
  ) => {
    const [first, ...rest] = list;
    if (!first) return undefined;
    const span = first.years.toSorted();
    const from = facts.schoolYear(span[0] ?? 0);
    if (rest.length > 0)
      return t("runSince", {
        value: newest(first.value),
        from,
        older: format.list(
          rest.map((run) =>
            t("runOlder", {
              value: older(run.value),
              count: run.years.length,
              years: years(run.years),
            }),
          ),
        ),
      });
    return span.length > 1
      ? t("runAll", {
          value: newest(first.value),
          from,
          to: facts.schoolYear(span.at(-1) ?? 0),
        })
      : t("runOne", { value: newest(first.value), year: from });
  };
  const places = runs(
    history.flatMap(({ year, budget, self }) =>
      typeof budget === "number" && typeof self === "number"
        ? [{ year, value: { budget, self } }]
        : [],
    ),
  );
  const tuition = runs(
    history.flatMap(({ year, tuition }) =>
      typeof tuition === "number" ? [{ year, value: tuition }] : [],
    ),
  );
  const placesValue = (v: { budget: number; self: number }) =>
    t("placesValue", {
      budget: facts.count(v.budget),
      self: facts.count(v.self),
    });
  const missing = history
    .filter((y) => [y.budget, y.self, y.tuition].includes(null))
    .map((y) => y.year)
    .toSorted();
  const [installments, affirmative] = await Promise.all(
    [fees?.installments, fees?.affirmative].map(
      (md) => md && renderMarkdown(md, program.id),
    ),
  );
  const placesText = sentence(places, placesValue, placesValue);
  const tuitionText = sentence(
    tuition,
    (v) => t("tuitionValue", { amount: facts.money(v) }),
    facts.money,
  );
  const konkursi = history
    .filter((y) => y.budget !== undefined || y.tuition !== undefined)
    .toReversed()
    .map((y) => ({
      key: y.year,
      text: facts.schoolYear(y.year),
      label: t("konkursLabel", { short, year: facts.schoolYear(y.year) }),
      url: y.konkurs,
    }));

  return (
    <div>
      <h3 className="mb-2 font-semibold text-base">{t("moneyTitle")}</h3>
      <ul className="text-[15px]">
        {placesText && (
          <li className={fact}>
            <span className="font-semibold">{t("placesLead")}</span>{" "}
            {placesText}
          </li>
        )}
        {tuitionText && (
          <li className={fact}>
            <span className="font-semibold">{t("tuitionLead")}</span>{" "}
            {compact([
              tuitionText,
              fees &&
                t("foreignTuition", {
                  amount: facts.euro(fees.foreignTuition),
                }),
            ]).join(" ")}
          </li>
        )}
        {installments && (
          <li className={fact}>
            <MathHtml html={installments} className="leading-normal" />
          </li>
        )}
      </ul>
      <div className={under}>
        {missing.map((year) => (
          <p key={year}>{t("missing", { year: facts.schoolYear(year) })}</p>
        ))}
        {affirmative && (
          <MathHtml html={affirmative} className="leading-normal" />
        )}
        <SourceYears
          years={konkursi}
          intro={(list) => t.rich("konkursSources", { short, list })}
        />
      </div>
    </div>
  );
}

export async function AdmissionBand({ program }: { program: Program }) {
  const t = await getTranslations("Program");
  const history = programHistory(program.faculty, program.slug);
  const results = resultYears(history).length > 0;

  return (
    <Band
      name="upis"
      id="upis"
      title={t("admissionTitle", { results: results ? "yes" : "no" })}
      wide
      className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-14"
    >
      <MoneyFacts program={program} history={history} />
      {results && <CutoffsTable program={program} history={history} />}
    </Band>
  );
}
