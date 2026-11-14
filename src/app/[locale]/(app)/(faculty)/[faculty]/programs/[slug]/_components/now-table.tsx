import { cn } from "cn";
import { ArrowDownIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  currentAdmission,
  latestResults,
} from "@/features/admission/admissions";
import { Figure } from "@/features/admission/figure";
import type { Program } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";

const head =
  "pb-2 text-right align-bottom font-medium text-muted-foreground text-xs";
const cell = "border-t py-2 align-middle";
const figure = cn(cell, "text-right font-semibold text-[17px] leading-6");

function RowHead({ title, note }: { title: string; note?: string }) {
  return (
    <th
      scope="row"
      className={cn(cell, "text-left font-normal text-[15px] leading-5")}
    >
      {title}
      {note && (
        <span className="block text-[13px] text-muted-foreground leading-4.5">
          {note}
        </span>
      )}
    </th>
  );
}

export async function NowTable({
  program,
  results,
  className,
}: {
  program: Program;
  results: boolean;
  className?: string;
}) {
  const [t, facts] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
  ]);
  const { short } = facultyOf(program.faculty);
  const current = currentAdmission(program.faculty);
  const latest = latestResults(program.faculty);
  const row = current.programs[program.slug];
  const cutoff = latest?.programs[program.slug]?.cutoff;
  const year = facts.schoolYear(current.year);
  const resultsYear = latest ? facts.schoolYear(latest.year) : "";
  const foreign = current.fees?.foreignTuition;
  const note = [
    foreign && t("foreignTuition", { amount: facts.euro(foreign) }),
    cutoff && t("cutoffsMeaning", { year: resultsYear }),
  ].filter(Boolean);

  return (
    <div className={className}>
      <table className="w-full table-fixed border-collapse tabular-nums">
        <caption className="sr-only">
          {t("nowCaption", { year, name: program.name })}
        </caption>
        <colgroup>
          <col />
          <col className="w-23" />
          <col className="w-31" />
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              className="pb-1.5 text-left align-bottom font-medium text-[13px] text-muted-foreground"
            >
              {t("nowHead", { year })}
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
          <tr>
            <RowHead title={t("places")} />
            <td className={figure}>
              <Figure value={row?.budget} kind="count" short={short} />
            </td>
            <td className={figure}>
              <Figure value={row?.self} kind="count" short={short} />
            </td>
          </tr>
          <tr>
            <RowHead title={t("tuition")} note={t("tuitionUnit")} />
            <td className={cn(figure, "font-medium text-[15px]")}>
              {t("free")}
            </td>
            <td className={figure}>
              <Figure value={row?.tuition} kind="count" short={short} />
            </td>
          </tr>
          {cutoff && (
            <tr>
              <RowHead
                title={t("cutoffs")}
                note={t("cutoffsYear", { year: resultsYear })}
              />
              <td className={figure}>
                <Figure value={cutoff.budget} kind="score" short={short} />
              </td>
              <td className={figure}>
                <Figure value={cutoff.self} kind="score" short={short} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {note.length > 0 && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {note.join(" ")}
        </p>
      )}
      <Link
        href="#upis"
        className="mt-1 flex min-h-11 items-center justify-between gap-2 font-medium text-[15px] text-data underline-offset-4 hover:[&>span]:underline"
      >
        <span>{t("admissionTitle", { results: results ? "yes" : "no" })}</span>
        <ArrowDownIcon aria-hidden className="size-4 shrink-0" />
      </Link>
    </div>
  );
}
