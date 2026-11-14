import { getTranslations } from "next-intl/server";
import { ExternalLink } from "@/components/external-link";
import { currentAdmission } from "@/features/admission/admissions";
import { examRecord } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { differentLayout } from "@/features/variants/exam-layout";
import { examPapers } from "@/features/variants/variants";
import { getFacts } from "@/i18n/facts";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import {
  AboutSection,
  actionClass,
  listClass,
  quietLink,
} from "./about-section";

type Paper = ReturnType<typeof examPapers>[number];

async function PaperCaption({
  paper,
  latest,
  different,
  short,
}: {
  paper: Paper;
  latest: boolean;
  different: boolean;
  short: string;
}) {
  const [t, facts] = await Promise.all([
    getTranslations("ExamAbout"),
    getFacts(),
  ]);
  const parts = [
    latest && paper.held && t("held", { date: facts.date(paper.held) }),
    latest && paper.original && (
      <ExternalLink key="original" href={paper.original} className={quietLink}>
        {t("original", { short })}
      </ExternalLink>
    ),
    different && t("differentLayout"),
  ].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <p className="col-span-full -mt-2.5 pb-1.5 text-[13px] text-subtle [&_a]:text-muted-foreground">
      {parts.flatMap((part, i) => (i > 0 ? [" · ", part] : [part]))}
    </p>
  );
}

export async function ArchiveSection({ examId }: { examId: string }) {
  const [t, factsT, facts] = await Promise.all([
    getTranslations("ExamAbout"),
    getTranslations("Facts"),
    getFacts(),
  ]);
  const exam = examRecord(examId);
  const { short } = facultyOf(exam.faculty);
  const papers = examPapers(examId);
  const places = exam.positions.map((p) => p.topic);
  const years = papers.map((p) => p.year);
  const admission = currentAdmission(exam.faculty);
  const [sitting] = admission.schedule?.exams[examId] ?? [];
  const papersLink = exam.about?.papers;

  return (
    <AboutSection
      id="arhiva"
      title={t("archiveTitle")}
      caption={t.rich("archiveCaption", {
        tasks: exam.positions.length,
        from: String(Math.max(...years)),
        to: String(Math.min(...years)),
        hours: (exam.minutes ?? 0) / 60,
        short,
        nowrap: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
      })}
    >
      <ul className={listClass}>
        {papers.map((paper, i) => {
          const year = String(paper.year);
          return (
            <li
              key={paper.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-5 py-0.5"
            >
              <Link
                href={`/variants/${paper.id}/solutions`}
                aria-label={t("solutionsLabel", { year })}
                data-intent={intentOf({ via: "about_archive", rank: i + 1 })}
                className="group flex min-h-11 items-center justify-between gap-4"
              >
                <span className="whitespace-nowrap font-medium tabular-nums">
                  {t("yearName", { year })}
                </span>
                <span
                  className={`${actionClass} underline-offset-3 group-hover:underline`}
                >
                  {t("solutions")}
                </span>
              </Link>
              <Link
                href={`/variants/${paper.id}`}
                aria-label={t("timedLabel", { year })}
                data-intent={intentOf({ via: "about_archive", rank: i + 1 })}
                className={actionClass}
              >
                {t("timed")}
              </Link>
              <PaperCaption
                paper={paper}
                latest={i === 0}
                different={differentLayout(paper, places)}
                short={short}
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] text-muted-foreground">
        {papersLink &&
          t.rich("papers", {
            link: () => (
              <ExternalLink href={papersLink.url} className={quietLink}>
                {t("documentTitle", { title: papersLink.title, short })}
              </ExternalLink>
            ),
          })}
        {sitting &&
          ` ${t("sitting", {
            exam: exam.title,
            year: String(admission.year),
            day: facts.day(sitting.date),
            from: facts.clock(sitting.from),
            to: sitting.to ? facts.clock(sitting.to) : "",
            closed: sitting.to ? "yes" : "no",
            schoolYear: facts.schoolYear(admission.year),
            missing: years.includes(admission.year) ? "no" : "yes",
          })}`}
        {exam.about?.checked &&
          ` ${factsT("checkedOn", { date: facts.date(exam.about.checked) })}`}
      </p>
    </AboutSection>
  );
}
