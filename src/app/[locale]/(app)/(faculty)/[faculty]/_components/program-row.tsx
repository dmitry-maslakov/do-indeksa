import { cn } from "cn";
import type { Admission, Program } from "content-collections";
import { getTranslations } from "next-intl/server";
import { Figure, figureNote, PairCell } from "@/features/admission/figure";
import { FilterRow } from "@/features/admission/program-search";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

export const tracks =
  "grid grid-cols-[minmax(0,--spacing(25))_minmax(0,1fr)_minmax(0,--spacing(29))] gap-x-3 lg:grid-cols-[minmax(0,1fr)_--spacing(44)_--spacing(40)_--spacing(64)] lg:gap-x-8";

const cell = "text-[15px] tabular-nums lg:py-3.5 lg:text-right";

type Places = Admission["programs"][string];

interface ProgramRowProps {
  faculty: string;
  short: string;
  searchKey: string;
  rank: number;
  program: Program;
  places?: Places;
  cutoff?: Places["cutoff"];
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
      <PairCell pair={places} kind="count" short={short} className={cell} />
      <td className={cell}>
        <Figure value={places?.tuition} kind="count" short={short} />
        {places?.tuition === null && (
          <span
            aria-hidden="true"
            className={cn(figureNote, "whitespace-normal lg:whitespace-nowrap")}
          >
            {unpublished("unpublished", { short })}
          </span>
        )}
      </td>
      <PairCell pair={cutoff} kind="score" short={short} className={cell} />
    </FilterRow>
  );
}
