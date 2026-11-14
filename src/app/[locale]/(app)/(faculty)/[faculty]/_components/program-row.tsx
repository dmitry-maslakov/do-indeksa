import { cn } from "cn";
import type { Admission, Program } from "content-collections";
import { getTranslations } from "next-intl/server";
import { Figure } from "@/features/admission/figure";
import { FilterRow } from "@/features/admission/program-search";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

export const tracks =
  "grid grid-cols-[minmax(0,--spacing(25))_minmax(0,1fr)_minmax(0,--spacing(29))] gap-x-3 lg:grid-cols-[minmax(0,1fr)_--spacing(44)_--spacing(40)_--spacing(64)] lg:gap-x-8";

const cell = "text-[15px] tabular-nums lg:py-3.5 lg:text-right";
const note = "block whitespace-nowrap text-subtle text-xs leading-3.5";

type Places = Admission["programs"][string];

interface Pair {
  budget?: number | null;
  self?: number | null;
}

interface ProgramRowProps {
  faculty: string;
  short: string;
  searchKey: string;
  rank: number;
  program: Program;
  places?: Places;
  cutoff?: Places["cutoff"];
}

async function PairCell({
  pair,
  kind,
  short,
}: {
  pair?: Pair;
  kind: "count" | "score";
  short: string;
}) {
  const t = await getTranslations("Faculty");
  const unpublished = await getTranslations("Facts");
  const missing = pair?.budget === null || pair?.self === null;
  return (
    <td className={cn(cell, "lg:grid lg:grid-cols-2 lg:gap-x-4")}>
      <span className="block whitespace-nowrap lg:contents">
        <span>
          <span className="sr-only">{t("budget")} </span>
          <Figure value={pair?.budget} kind={kind} short={short} />
        </span>
        <span aria-hidden="true" className="whitespace-pre lg:hidden">
          {" / "}
        </span>
        <span className="text-muted-foreground">
          <span className="sr-only">{t("srSelf")} </span>
          <Figure value={pair?.self} kind={kind} short={short} />
        </span>
      </span>
      <span aria-hidden="true" className={cn(note, "lg:hidden")}>
        {t("pairKey")}
      </span>
      {missing && (
        <span aria-hidden="true" className={cn(note, "lg:col-start-2")}>
          {unpublished("unpublished", { short })}
        </span>
      )}
    </td>
  );
}

export async function ProgramRow({
  faculty,
  short,
  searchKey,
  rank,
  program,
  places,
  cutoff,
}: ProgramRowProps) {
  const t = await getTranslations("Faculty");
  const unpublished = await getTranslations("Facts");

  return (
    <FilterRow
      id={program.slug}
      searchKey={searchKey}
      className={cn(
        tracks,
        "scroll-mt-14 border-b py-2 target:animate-target lg:min-h-13 lg:scroll-mt-16 lg:items-start lg:py-0",
      )}
    >
      <th
        scope="row"
        className="col-span-full text-left font-medium text-[15px] lg:col-span-1 lg:py-3.5"
      >
        {program.checked ? (
          <Link
            href={`/${faculty}/programs/${program.slug}`}
            data-intent={intentOf({ via: "faculty_row", rank })}
            className="text-data underline-offset-3 hover:underline"
          >
            {program.name}
          </Link>
        ) : (
          <span>{program.name}</span>
        )}
        {program.short && (
          <span className="font-normal text-muted-foreground">
            {" "}
            ({program.short})
          </span>
        )}
        {program.level === "applied" && (
          <>
            {" "}
            <span className="whitespace-nowrap font-normal text-[13px] text-muted-foreground">
              <span className="sr-only">, </span>
              {t("applied", { years: program.years })}
            </span>
          </>
        )}
      </th>
      <PairCell pair={places} kind="count" short={short} />
      <td className={cell}>
        <Figure value={places?.tuition} kind="count" short={short} />
        {places?.tuition === null && (
          <span
            aria-hidden="true"
            className={cn(note, "whitespace-normal lg:whitespace-nowrap")}
          >
            {unpublished("unpublished", { short })}
          </span>
        )}
      </td>
      <PairCell pair={cutoff} kind="score" short={short} />
    </FilterRow>
  );
}
