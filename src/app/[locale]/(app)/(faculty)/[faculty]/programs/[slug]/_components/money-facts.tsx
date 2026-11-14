import { compact } from "es-toolkit";
import { getFormatter, getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import {
  currentAdmission,
  type ProgramYear,
  type Run,
  runs,
} from "@/features/admission/admissions";
import type { Program } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { renderMarkdown } from "@/lib/markdown";
import { SourceYears, sourceNotes } from "./source-years";

const fact = "border-t py-2 last:border-b";

export async function MoneyFacts({
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
    [first, ...rest]: Run<T>[],
    newest: (value: T) => string,
    older: (value: T) => string,
  ) => {
    if (!first) return undefined;
    const from = facts.schoolYear(Math.min(...first.years));
    const to = facts.schoolYear(Math.max(...first.years));
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
    return from === to
      ? t("runOne", { value: newest(first.value), year: from })
      : t("runAll", { value: newest(first.value), from, to });
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
  const cycles = history
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
      <h3 className="mb-2 text-balance font-semibold text-base">
        {t("moneyTitle")}
      </h3>
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
      <div className={sourceNotes}>
        {missing.map((year) => (
          <p key={year}>{t("missing", { year: facts.schoolYear(year) })}</p>
        ))}
        {affirmative && (
          <MathHtml html={affirmative} className="leading-normal" />
        )}
        <SourceYears
          years={cycles}
          intro={(list) => t.rich("konkursSources", { short, list })}
        />
      </div>
    </div>
  );
}
