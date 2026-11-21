import { uniq } from "es-toolkit";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { SourceLine } from "@/features/admission/source-line";
import {
  examHours,
  examLabel,
  examRecord,
  examTests,
} from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { intentOf } from "@/lib/analytics-browser";
import { actionClass, quietLink } from "./about-section";

export async function AboutHead({ examId }: { examId: string }) {
  const [t, meta, locale] = await Promise.all([
    getTranslations("ExamAbout"),
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const exam = examRecord(examId);
  const faculty = facultyOf(exam.faculty);
  const tests = examTests(examId);
  const [test] = tests;
  const points = uniq(exam.positions.map((p) => p.points));
  const aids = exam.about?.aids ?? [];
  const rules = [
    t("answers", { answers: test?.answers ?? "" }),
    t("points", {
      same: points.length === 1 ? "yes" : "no",
      max: String(Math.max(...points)),
      grading: exam.about?.grading ?? "",
    }),
    t("penalty", {
      penalty: tests.some((x) => x.penalty > 0) ? "yes" : "no",
    }),
    t("aids", { aids: aids.length === 2 ? "both" : (aids[0] ?? "none") }),
  ].filter(Boolean);
  const toc = [
    ["teme", t("tocTopics")],
    ["arhiva", t("tocArchive")],
    ...(exam.about?.exemption ? [["oslobadjanje", t("tocExemption")]] : []),
    ["smerovi", t("tocPrograms")],
  ];

  return (
    <header>
      <nav aria-label={t("crumbs")} className="text-[13px] text-subtle">
        <ol className="flex flex-wrap gap-1 [&>li+li]:before:mr-1 [&>li+li]:before:content-['›']">
          <li>
            <Link
              exam={null}
              href="/"
              className="hover:text-muted-foreground hover:underline"
            >
              {meta("title")}
            </Link>
          </li>
          <li>
            <Link
              exam={null}
              locale={routing.defaultLocale}
              href={`/${faculty.id}`}
              className="hover:text-muted-foreground hover:underline"
            >
              {faculty.short}
            </Link>
          </li>
          <li aria-current="page">
            {exam.title} · {examLabel(exam, locale)}
          </li>
        </ol>
      </nav>
      <PageTitle size="lg" className="mt-2">
        {t("title", {
          exam: exam.title,
          short: faculty.short,
          subject: test?.subject ?? "",
        })}
      </PageTitle>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {t("faculty", {
          name: faculty.name,
          cityLocative: faculty.cityLocative,
        })}
      </p>
      <p className="mt-4 whitespace-nowrap font-medium text-lg leading-6.5 tabular-nums lg:text-xl lg:leading-7">
        {t.rich("format", {
          tasks: exam.positions.length,
          hours: examHours(exam),
          points: String(exam.points),
          dot: () => (
            <span aria-hidden className="px-1 text-subtle">
              ·
            </span>
          ),
        })}
      </p>
      <ul className="mt-3 max-w-read list-disc space-y-1 pl-5 marker:text-subtle">
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <SourceLine
        faculty={faculty.id}
        refs={exam.about?.rulesSources ?? []}
        linkClassName={quietLink}
        className="mt-2"
      />
      <Button
        variant="lime"
        nativeButton={false}
        render={<Link href="/" data-intent={intentOf({ via: "about" })} />}
        className="mt-6 h-12 w-full text-base lg:w-auto"
      >
        {t("practice", { exam: exam.title })}
      </Button>
      <nav aria-label={t("onPage")} className="mt-3">
        <ul className="flex flex-wrap gap-x-5">
          {toc.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className={actionClass}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
