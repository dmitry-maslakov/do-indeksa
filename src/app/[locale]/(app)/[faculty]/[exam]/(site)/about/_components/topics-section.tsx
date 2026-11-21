import { ChevronDownIcon } from "lucide-react";
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
  noteClass,
  nowrap,
  quietLink,
  type Years,
} from "./about-section";

const nameClass = "font-medium underline-offset-3 group-hover:underline";

async function TopicSheet({
  id,
  year,
  number,
  topic,
  name,
  notes,
}: {
  id: string;
  year: number;
  number: number;
  topic: string;
  name: string;
  notes: ReactNode;
}) {
  const t = await getTranslations("ExamAbout");
  const task = getTask(id);
  if (!task) return null;

  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-start py-3.5 [&::-webkit-details-marker]:hidden">
        <Place value={number} />
        <span className="min-w-0 flex-1">
          <TopicName name={name} />
          <span className="sr-only">
            {", "}
            {t("taskSummary", { year: String(year) })}
          </span>
          {notes}
        </span>
      </summary>
      <div className="mb-4 rounded-xl bg-muted p-4 lg:px-6 lg:py-5">
        <MathHtml
          html={await renderStatement(task)}
          className="leading-normal [&_strong]:font-semibold"
        />
        <p className="mt-1 -mb-3 flex flex-wrap gap-x-6">
          <Link
            href={`/bank/${id}`}
            aria-label={t("taskLinkLabel", {
              year: String(year),
              place: String(number),
            })}
            className={actionClass}
          >
            {t("taskLink", { place: String(number) })}
          </Link>
          <Link
            href={bankHref({ topic })}
            data-intent={intentOf({ via: "about_topics", rank: number })}
            className={actionClass}
          >
            {t("topicLink")}
          </Link>
        </p>
      </div>
    </details>
  );
}

function TopicName({ name }: { name: string }) {
  const words = name.split(" ");
  const last = words.pop();
  const head = words.join(" ");
  return (
    <span className={nameClass}>
      {head && `${head} `}
      <span className="whitespace-nowrap">
        {last}
        <ChevronDownIcon
          aria-hidden
          className="ml-1 inline size-4 align-[-0.125em] text-subtle group-open:rotate-180"
        />
      </span>
    </span>
  );
}

function Place({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="w-7 shrink-0 font-semibold text-[15px] text-subtle tabular-nums"
    >
      {value}
    </span>
  );
}

export async function TopicsSection({
  examId,
  years,
}: {
  examId: string;
  years: Years;
}) {
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
  const first = String(years.first);
  const last = String(years.last);
  const syllabus = exam.about?.syllabus;

  return (
    <AboutSection
      id="teme"
      title={t("topicsTitle")}
      caption={t.rich("topicsCaption", {
        from: String(layoutSince(papers, places) ?? last),
        to: last,
        latest: last,
        short,
        nowrap,
      })}
    >
      <ol className={listClass}>
        {exam.positions.map(({ number, topic }, i) => {
          const name = topicName(topic, locale);
          const taskId = latest?.taskIds[i];
          const placeNotes = notes[i]?.map((note) => (
            <span
              key={note.topic}
              className="mt-0.5 block text-[13px] text-muted-foreground"
            >
              {t("placeNote", {
                years: format.list(
                  note.years.map((year) => t("year", { year: String(year) })),
                ),
                topic: topicName(note.topic, locale),
              })}
            </span>
          ));
          return (
            <li key={number}>
              {latest && taskId ? (
                <TopicSheet
                  id={taskId}
                  year={latest.year}
                  number={number}
                  topic={topic}
                  name={name}
                  notes={placeNotes}
                />
              ) : (
                <Link
                  href={bankHref({ topic })}
                  data-intent={intentOf({ via: "about_topics", rank: number })}
                  className="group flex min-h-11 items-start py-3.5"
                >
                  <Place value={number} />
                  <span className="min-w-0 flex-1">
                    <span className={nameClass}>{name}</span>
                    {placeNotes}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <p className={noteClass}>
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
