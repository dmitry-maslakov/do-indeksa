import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { currentAdmission } from "@/features/admission/admissions";
import {
  neighbours,
  type Program,
  programExam,
} from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { officialYears } from "@/features/variants/variants";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { Band } from "./band";

const action = "text-data underline-offset-3 hover:underline";

export async function NeighboursBand({ program }: { program: Program }) {
  const list = neighbours(program);
  if (list.length === 0) return null;
  const [t, facts] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
  ]);
  const { short } = facultyOf(program.faculty);
  const exam = programExam(program);
  const { wishes } = currentAdmission(program.faculty);
  const papers = exam.about && officialYears(exam.id);
  const rows = Math.ceil(list.length / 3);

  return (
    <Band name="susedi" title={t("neighboursTitle", { exam: exam.title })} wide>
      <ul
        style={{ "--rows": rows } as CSSProperties}
        className="lg:grid lg:grid-flow-col lg:grid-cols-3 lg:grid-rows-[repeat(var(--rows),auto)] lg:gap-x-6"
      >
        {list.map((neighbour, i) => (
          <li key={neighbour.slug}>
            <Link
              href={`/${neighbour.faculty}/programs/${neighbour.slug}`}
              data-intent={intentOf({ via: "program_neighbours", rank: i })}
              className={cn(
                "flex min-h-13 items-center justify-between gap-3 border-b py-3.5 text-[15px] underline-offset-3 hover:[&>span]:underline",
                i === 0 && "border-t",
                i % rows === 0 && "lg:border-t",
              )}
            >
              <span>{neighbour.name}</span>
              <ChevronRightIcon
                aria-hidden
                className="size-4 shrink-0 text-subtle"
              />
            </Link>
          </li>
        ))}
      </ul>
      {wishes && (
        <p className="mt-4 text-[15px]">
          {t("wishes", { max: facts.word(wishes.max), count: wishes.max })}{" "}
          <Link href={`/${program.faculty}#zelje`} className={action}>
            {t("wishesLink")}
          </Link>
        </p>
      )}
      <p className="mt-3 flex flex-col gap-2 text-[15px] lg:flex-row lg:gap-6">
        {papers && (
          <Link exam={exam.path} href="/about#arhiva" className={action}>
            {t("archive", {
              exam: exam.title,
              first: String(papers.first),
              last: String(papers.last),
            })}
          </Link>
        )}
        <Link href={`/${program.faculty}#${exam.segment}`} className={action}>
          {t("allPrograms", { short })}
        </Link>
      </p>
    </Band>
  );
}
