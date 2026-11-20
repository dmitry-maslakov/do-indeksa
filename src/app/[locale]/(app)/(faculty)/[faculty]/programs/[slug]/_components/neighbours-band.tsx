import { cn } from "cn";
import { getTranslations } from "next-intl/server";
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
const row = "flex min-h-13 items-center py-3.5 text-[15px]";

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

  return (
    <Band name="neighbours" title={t("neighboursTitle", { exam: exam.title })}>
      <ul className="border-t [&>li]:border-b">
        {list.map((neighbour, i) => (
          <li key={neighbour.slug}>
            {neighbour.linked ? (
              <Link
                href={`/${neighbour.faculty}/programs/${neighbour.slug}`}
                data-intent={intentOf({ via: "program_neighbours", rank: i })}
                className={cn(row, action)}
              >
                {neighbour.name}
              </Link>
            ) : (
              <span className={row}>{neighbour.name}</span>
            )}
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
