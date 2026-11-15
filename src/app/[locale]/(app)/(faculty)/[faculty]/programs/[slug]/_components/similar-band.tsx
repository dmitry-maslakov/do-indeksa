import { cn } from "cn";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import {
  currentAdmission,
  latestResults,
  maxPoints,
} from "@/features/admission/admissions";
import { Figure, PairCell } from "@/features/admission/figure";
import { type Program, similarPrograms } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { Band } from "./band";

const link = "text-data underline-offset-3 hover:underline";
const caption =
  "lg:col-span-full lg:mb-1 lg:block lg:border-b lg:pb-1 lg:text-foreground";
const unit = "block font-normal text-subtle";
const cell = "mt-2.5 text-[15px] lg:mt-0 lg:text-right";
const wide = (chunks: ReactNode) => (
  <span className="hidden lg:inline">{chunks}</span>
);

const tracksOf = (results: boolean) =>
  cn(
    "grid grid-cols-3 gap-x-3 border-b lg:gap-x-5",
    results
      ? "lg:grid-cols-[minmax(0,1fr)_--spacing(32)_--spacing(28)_--spacing(28)]"
      : "lg:grid-cols-[minmax(0,1fr)_--spacing(32)_--spacing(28)]",
  );

interface RowProps {
  faculty: string;
  slug: string;
  results: boolean;
  head: ReactNode;
}

async function Row({ faculty, slug, results, head }: RowProps) {
  const { short } = facultyOf(faculty);
  const places = currentAdmission(faculty).programs[slug];
  const cutoff = latestResults(faculty)?.programs[slug]?.cutoff;

  return (
    <tr className={cn(tracksOf(results), "py-3.5 tabular-nums")}>
      <th
        scope="row"
        className="col-span-full text-left font-normal text-[15px] lg:col-span-1"
      >
        {head}
      </th>
      <PairCell pair={places} kind="count" short={short} className={cell} />
      {results && (
        <td className={cell}>
          <Figure value={cutoff?.budget} kind="score" short={short} />
        </td>
      )}
      <td className={cell}>
        <Figure value={places?.tuition} kind="count" short={short} />
      </td>
    </tr>
  );
}

async function ColumnHead({ faculty }: { faculty: string }) {
  const [t, tf, facts] = await Promise.all([
    getTranslations("Program"),
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const current = currentAdmission(faculty);
  const results = latestResults(faculty);
  const year = facts.schoolYear(current.year);

  return (
    <thead className="block">
      <tr
        className={cn(
          tracksOf(Boolean(results)),
          "items-end pb-2 text-muted-foreground text-xs lg:text-right",
        )}
      >
        <th scope="col" className="hidden text-left font-medium lg:block">
          {tf("colProgram")}
        </th>
        <th
          scope="col"
          className="text-left font-medium lg:grid lg:grid-cols-2 lg:gap-x-4 lg:text-right"
        >
          <span className={caption}>{tf("colPlaces", { year })}</span>
          <span className={cn(unit, "hidden lg:block")}>{tf("budget")}</span>
          <span className={cn(unit, "hidden lg:block")}>{tf("self")}</span>
        </th>
        {results && (
          <th scope="col" className="text-left font-medium lg:text-right">
            <span className={caption}>
              {t("similarCutoffs", { year: facts.schoolYear(results.year) })}
            </span>
            <span className={unit}>
              {t("similarCutoffsUnit", { max: String(maxPoints(current)) })}
            </span>
          </th>
        )}
        <th scope="col" className="text-left font-medium lg:text-right">
          <span className={caption}>
            {tf.rich("colTuition", { year, wide })}
          </span>
          <span className={unit}>{t("tuitionUnit")}</span>
        </th>
      </tr>
    </thead>
  );
}

export async function SimilarBand({ program }: { program: Program }) {
  const list = similarPrograms(program);
  if (list.length === 0) return null;
  const [t, tf, facts] = await Promise.all([
    getTranslations("Program"),
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const results = latestResults(program.faculty);
  const year = results ? facts.schoolYear(results.year) : "";
  const row = { faculty: program.faculty, results: Boolean(results) };

  return (
    <Band name="slicni" id="slicni" title={t("similarTitle")} wide>
      <table className="block w-full">
        <caption className="sr-only">
          {t("similarCaption", {
            places: facts.schoolYear(currentAdmission(program.faculty).year),
            results: results ? "yes" : "no",
            year,
          })}
        </caption>
        <ColumnHead faculty={program.faculty} />
        <tbody className="block">
          <Row
            {...row}
            slug={program.slug}
            head={
              <>
                <span className="font-medium">{program.name}</span>{" "}
                <span className="text-[13px] text-muted-foreground">
                  {t("similarOwn")}
                </span>
              </>
            }
          />
          {list.map(({ program: other, linked, text, ...counts }, rank) => (
            <Row
              key={other.slug}
              {...row}
              slug={other.slug}
              head={
                <>
                  {linked ? (
                    <Link
                      href={`/${other.faculty}/programs/${other.slug}`}
                      data-intent={intentOf({ via: "program_similar", rank })}
                      className={cn(link, "font-medium")}
                    >
                      {other.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{other.name}</span>
                  )}
                  <span className="mt-0.5 block">{text}</span>
                  <span className="mt-1 block text-[13px] text-muted-foreground">
                    {t("similarFact", counts)}
                    {other.links.plan && (
                      <>
                        {" "}
                        <ExternalLink
                          href={other.links.plan.url}
                          className={link}
                        >
                          {t("similarPlan")}
                        </ExternalLink>
                      </>
                    )}
                  </span>
                </>
              }
            />
          ))}
        </tbody>
      </table>
      <p className="mt-2.5 text-[13px] text-muted-foreground">
        {tf("keyLine", { results: results ? "yes" : "no", year })}
      </p>
    </Band>
  );
}
