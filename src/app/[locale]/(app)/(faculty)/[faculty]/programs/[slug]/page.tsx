import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { breadcrumbList, JsonLd } from "@/components/json-ld";
import {
  currentAdmission,
  programHistory,
  resultYears,
} from "@/features/admission/admissions";
import { facultyPrograms, getProgram } from "@/features/admission/programs";
import { faculties, facultyOf } from "@/features/catalog/faculties";
import { untranslated } from "@/i18n/alternates";
import { getFacts } from "@/i18n/facts";
import { routing } from "@/i18n/routing";
import { ProgramView } from "./_components/program-view";

export function generateStaticParams() {
  return faculties.flatMap((f) =>
    facultyPrograms(f.id).map((p) => ({ faculty: f.id, slug: p.slug })),
  );
}

async function programOf(params: Promise<{ faculty: string; slug: string }>) {
  const [{ faculty, slug }, locale] = await Promise.all([params, getLocale()]);
  return locale === routing.defaultLocale
    ? getProgram(faculty, slug)
    : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/programs/[slug]">): Promise<Metadata> {
  const program = await programOf(params);
  if (!program) return {};
  const [t, facts] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
  ]);
  const faculty = facultyOf(program.faculty);
  const current = currentAdmission(program.faculty);
  const row = current.programs[program.slug];
  const results = resultYears(programHistory(program.faculty, program.slug));
  const [last] = results;
  const first = results.at(-1);
  const figure = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : facts.count(value);
  const place = {
    name: program.name,
    short: faculty.short,
    kind: program.modules.length > 0 ? program.moduleKind : "none",
    results: last ? "yes" : "no",
  };

  return {
    title: { absolute: t("metaTitle", place) },
    description: t("metaDescription", {
      ...place,
      cityLocative: faculty.cityLocative,
      from: t("fromYear", { n: program.modulesFrom ?? 0 }),
      budget: figure(row?.budget),
      self: figure(row?.self),
      year: facts.schoolYear(current.year),
      tuition: figure(row?.tuition),
      span: first && last && first !== last ? "yes" : "no",
      first: first ? facts.schoolYear(first.year) : "",
      last: last ? facts.schoolYear(last.year) : "",
    }),
    ...untranslated(
      `/${program.faculty}/programs/${program.slug}`,
      routing.defaultLocale,
    ),
  };
}

export default async function ProgramPage({
  params,
}: PageProps<"/[locale]/[faculty]/programs/[slug]">) {
  const program = (await programOf(params)) ?? notFound();
  const meta = await getTranslations("Metadata");
  const faculty = facultyOf(program.faculty);

  return (
    <>
      <ProgramView program={program} />
      <JsonLd
        data={breadcrumbList([
          { name: meta("title"), href: "/" },
          { name: faculty.short, href: `/${faculty.id}` },
          {
            name: program.name,
            href: `/${faculty.id}/programs/${program.slug}`,
          },
        ])}
      />
    </>
  );
}
