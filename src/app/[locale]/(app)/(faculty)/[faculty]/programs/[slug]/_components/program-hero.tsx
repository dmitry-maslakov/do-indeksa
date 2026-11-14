import { ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { type Program, programExam } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { renderMarkdown } from "@/lib/markdown";
import { ModuleMap } from "./module-map";
import { NowTable } from "./now-table";

async function ExamRow({ program }: { program: Program }) {
  const [t, tf] = await Promise.all([
    getTranslations("Program"),
    getTranslations("Faculty"),
  ]);
  const exam = programExam(program);
  const label = tf("examLabel", { title: exam.title, name: exam.name });

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 lg:mt-5">
      <div>
        <span className="block text-[13px] text-muted-foreground">
          {t("examLabel")}
        </span>
        {exam.about ? (
          <Link
            exam={exam.path}
            href="/about"
            className="inline-flex items-center gap-0.5 font-semibold text-data text-lg underline-offset-4 hover:underline"
          >
            {label}
            <ChevronRightIcon aria-hidden className="size-4" />
          </Link>
        ) : (
          <span className="font-semibold text-lg">{label}</span>
        )}
      </div>
      <Button
        variant="lime"
        nativeButton={false}
        render={
          <Link
            exam={exam.path}
            href="/"
            data-intent={intentOf({ via: "program" })}
          />
        }
        className="h-12 px-5 text-base lg:h-11 lg:px-6"
      >
        {tf("practice", { exam: exam.title })}
      </Button>
    </div>
  );
}

export async function ProgramHero({
  program,
  results,
}: {
  program: Program;
  results: boolean;
}) {
  const t = await getTranslations("Program");
  const faculty = facultyOf(program.faculty);
  const intro = await renderMarkdown(program.content, program.id);

  return (
    <div className="pb-6 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:pb-8">
      <div className="lg:col-span-6 lg:col-start-1 lg:row-start-1">
        <p className="font-medium text-[13px] text-muted-foreground">
          {t.rich("path", {
            name: faculty.name,
            city: faculty.city,
            link: (chunks) => (
              <Link
                href={`/${faculty.id}`}
                className="underline decoration-1 decoration-input underline-offset-3"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <PageTitle size="lg" className="mt-1">
          {program.name}
          {program.short && ` (${program.short})`}
        </PageTitle>
        <MathHtml
          html={intro}
          className="mt-2 max-w-140 text-base text-muted-foreground leading-snug lg:mt-2.5"
        />
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {t("facts", {
            level: program.level,
            years: program.years,
            espb: String(program.espb),
          })}
        </p>
        <ExamRow program={program} />
      </div>
      <NowTable
        program={program}
        results={results}
        className="mt-4 border-t pt-2.5 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-0 lg:self-end lg:border-t-0 lg:pt-0"
      />
      <div className="mt-4 lg:col-span-12 lg:row-start-2 lg:mt-7 lg:border-t lg:pt-6">
        <ModuleMap program={program} />
      </div>
    </div>
  );
}
