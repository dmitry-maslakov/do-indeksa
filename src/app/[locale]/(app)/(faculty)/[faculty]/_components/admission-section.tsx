import { compact, uniq } from "es-toolkit";
import { getFormatter, getTranslations } from "next-intl/server";
import { ExternalLink } from "@/components/external-link";
import { MathHtml } from "@/components/math-html";
import { currentAdmission } from "@/features/admission/admissions";
import { SourceLine, sourceLink } from "@/features/admission/source-line";
import { facultyExams } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { renderMarkdown } from "@/lib/markdown";
import { InfoSection } from "./info-section";

export async function AdmissionSection({ faculty: id }: { faculty: string }) {
  const [t, facts, format] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
    getFormatter(),
  ]);
  const faculty = facultyOf(id);
  const { short, checked, links } = faculty;
  const { year, konkurs, schedule, wishes } = currentAdmission(id);
  const exams = facultyExams(id);
  const titleOf = (exam: string) =>
    exams.find((e) => e.id === exam)?.title ?? exam;
  const also = exams
    .filter((exam) => exam.open && wishes?.also[exam.id]?.length)
    .map((exam) => {
      const others = wishes?.also[exam.id] ?? [];
      return t("wishesAlso", {
        exam: exam.title,
        exams: format.list(others.map(titleOf)),
        count: others.length,
      });
    });
  const wishesHtml =
    wishes &&
    (await renderMarkdown(
      [
        t("wishes", { max: facts.word(wishes.max), count: wishes.max }),
        ...also,
        wishes.ranking,
      ].join(" "),
      id,
    ));
  const list = compact([
    {
      title: t("konkursLink", {
        year: facts.schoolYear(year),
        pdf: konkurs.toLowerCase().endsWith(".pdf") ? "yes" : "no",
      }),
      url: konkurs,
    },
    links.statistics,
    links.examRules,
    links.wishes,
    links.faq,
  ]);

  return (
    <InfoSection id="upis" title={t("admissionTitle", { short })}>
      <p>
        {t("nextCycle", {
          year: facts.schoolYear(year + 1),
          checked: checked ? "yes" : "no",
          date: checked ? facts.date(checked) : "",
        })}
        {schedule &&
          ` ${t("schedule", {
            year: facts.schoolYear(year),
            application: facts.span(
              schedule.application.from,
              schedule.application.to,
            ),
            exams: facts.days(
              uniq(
                Object.values(schedule.exams)
                  .flat()
                  .map((slot) => slot.date),
              ).toSorted(),
            ),
            lists: facts.date(schedule.finalRankLists),
          })}`}
      </p>
      {wishesHtml && (
        <div id="zelje" className="mt-3 scroll-mt-4">
          <MathHtml html={wishesHtml} className="leading-normal" />
        </div>
      )}
      <SourceLine
        faculty={id}
        refs={[{ cycle: year, section: wishes?.section }]}
        className="mt-3"
      >
        {links.wishes &&
          t.rich("wishesRules", {
            short,
            link: () => (
              <ExternalLink href={links.wishes?.url} className={sourceLink}>
                {links.wishes?.title}
              </ExternalLink>
            ),
          })}
      </SourceLine>
      <ul className="mt-4 border-t">
        {list.map((link) => (
          <li key={link.title}>
            <ExternalLink
              href={link.url}
              className="flex min-h-12 items-center justify-between gap-3 border-b font-medium text-[15px] text-data hover:underline"
              iconClassName="size-4"
            >
              {link.title}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}
