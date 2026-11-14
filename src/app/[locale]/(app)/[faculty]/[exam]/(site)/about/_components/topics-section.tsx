import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import { MathHtml } from "@/components/math-html";
import { bankHref } from "@/features/bank/params";
import { examRecord } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { getTask, renderStatement } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import {
  layoutSince,
  placeNotes,
  topicsSeen,
} from "@/features/variants/exam-layout";
import { examPapers } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import {
  AboutSection,
  actionClass,
  listClass,
  quietLink,
} from "./about-section";

async function TaskSheet({
  id,
  year,
  place,
  topic,
}: {
  id: string;
  year: number;
  place: number;
  topic: string;
}) {
  const t = await getTranslations("ExamAbout");
  const task = getTask(id);
  if (!task) return null;

  return (
    <details className="group ml-7">
      <summary className="-mt-1 inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-medium text-data text-sm [&::-webkit-details-marker]:hidden">
        <span className="underline-offset-3 group-hover:underline">
          {t("taskSummary", { year: String(year) })}
        </span>
        <span className="sr-only">
          {t("taskSummaryDetail", { place: String(place), topic })}
        </span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 group-open:rotate-180"
        />
      </summary>
      <div className="-ml-7 mb-4 rounded-xl bg-muted p-4 lg:max-w-task lg:px-6 lg:py-5">
        <MathHtml
          html={await renderStatement(task)}
          className="leading-normal [&_strong]:font-semibold"
        />
        <Link
          href={`/bank/${id}`}
          aria-label={t("taskLinkLabel", {
            year: String(year),
            place: String(place),
          })}
          className={`${actionClass} mt-1 -mb-3`}
        >
          {t("taskLink", { place: String(place) })}
        </Link>
      </div>
    </details>
  );
}

export async function TopicsSection({ examId }: { examId: string }) {
  const [t, format, locale] = await Promise.all([
    getTranslations("ExamAbout"),
    getFormatter(),
    getLocale(),
  ]);
  const exam = examRecord(examId);
  const { short } = facultyOf(exam.faculty);
  const papers = examPapers(examId);
  const [latest] = papers;
  const places = exam.positions.map((p) => p.topic);
  const notes = placeNotes(papers, places);
  const years = papers.map((p) => p.year);
  const first = String(Math.min(...years));
  const last = String(Math.max(...years));
  const syllabus = exam.about?.syllabus;
  const nowrap = (chunks: ReactNode) => (
    <span className="whitespace-nowrap">{chunks}</span>
  );

  return (
    <AboutSection
      id="teme"
      title={t("topicsTitle")}
      caption={t.rich("topicsCaption", {
        from: String(layoutSince(papers, places) ?? last),
        to: last,
        latest: String(latest?.year ?? last),
        short,
        nowrap,
      })}
    >
      <ol className={listClass}>
        {exam.positions.map(({ number, topic }, i) => {
          const name = topicName(topic, locale);
          const taskId = latest?.taskIds[i];
          return (
            <li key={number}>
              <Link
                href={bankHref({ topic })}
                data-intent={intentOf({ via: "about_topics", rank: number })}
                className="group flex min-h-11 items-start pt-3.5 pb-0.5"
              >
                <span
                  aria-hidden
                  className="w-7 shrink-0 font-semibold text-[15px] text-subtle tabular-nums"
                >
                  {number}
                </span>
                <span className="min-w-0 flex-1 font-medium underline-offset-3 group-hover:underline">
                  {name}
                </span>
                <ChevronRightIcon
                  aria-hidden
                  className="mt-1 ml-3 size-4 shrink-0 text-subtle group-hover:text-foreground"
                />
              </Link>
              {notes[i]?.map((note) => (
                <p
                  key={note.topic}
                  className="mx-7 text-[13px] text-muted-foreground"
                >
                  {t("placeNote", {
                    years: format.list(
                      note.years.map((year) =>
                        t("year", { year: String(year) }),
                      ),
                    ),
                    place: String(number),
                    topic: topicName(note.topic, locale),
                  })}
                </p>
              ))}
              {latest && taskId && (
                <TaskSheet
                  id={taskId}
                  year={latest.year}
                  place={number}
                  topic={name}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[13px] text-muted-foreground">
        {t.rich("areas", {
          syllabus: syllabus ? "yes" : "no",
          short,
          areas: syllabus?.areas ?? 0,
          from: first,
          to: last,
          topics: topicsSeen(papers),
          nowrap,
        })}
        {syllabus && (
          <>
            {" "}
            <ExternalLink href={syllabus.url} className={quietLink}>
              {t("documentTitle", { title: syllabus.title, short })}
            </ExternalLink>
          </>
        )}
      </p>
    </AboutSection>
  );
}
