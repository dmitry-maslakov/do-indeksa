import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { breadcrumbList, JsonLd } from "@/components/json-ld";
import {
  currentAdmission,
  latestResults,
} from "@/features/admission/admissions";
import { facultyPrograms } from "@/features/admission/programs";
import { faculties, getFaculty } from "@/features/catalog/faculties";
import { untranslated } from "@/i18n/alternates";
import { getFacts } from "@/i18n/facts";
import { routing } from "@/i18n/routing";
import { FacultyView } from "./_components/faculty-view";

export function generateStaticParams() {
  return faculties.map((f) => ({ faculty: f.id }));
}

async function facultyAt(params: Promise<{ faculty: string }>) {
  const [{ faculty }, locale] = await Promise.all([params, getLocale()]);
  return locale === routing.defaultLocale ? getFaculty(faculty) : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]">): Promise<Metadata> {
  const faculty = await facultyAt(params);
  if (!faculty) return {};
  const { id } = faculty;
  const [t, facts] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const results = latestResults(id);
  const place = {
    short: faculty.short,
    cityLocative: faculty.cityLocative,
    results: results ? "yes" : "no",
  };
  return {
    title: { absolute: t("metaTitle", place) },
    description: t("metaDescription", {
      ...place,
      count: facultyPrograms(id).length,
      places: facts.schoolYear(currentAdmission(id).year),
      year: results ? facts.schoolYear(results.year) : "",
    }),
    ...untranslated(`/${id}`, routing.defaultLocale),
  };
}

export default async function FacultyPage({
  params,
}: PageProps<"/[locale]/[faculty]">) {
  const faculty = (await facultyAt(params)) ?? notFound();
  const meta = await getTranslations("Metadata");

  return (
    <>
      <FacultyView faculty={faculty.id} />
      <JsonLd
        data={breadcrumbList([
          { name: meta("title"), href: "/" },
          { name: faculty.short, href: `/${faculty.id}` },
        ])}
      />
    </>
  );
}
