import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { breadcrumbList, JsonLd } from "@/components/json-ld";
import {
  examAt,
  examHours,
  examRecord,
  examTests,
} from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { officialYears } from "@/features/variants/variants";
import { untranslated } from "@/i18n/alternates";
import { routing } from "@/i18n/routing";
import { AboutView } from "./_components/about-view";

async function aboutOf(params: Promise<{ faculty: string; exam: string }>) {
  const exam = examRecord(examAt(await params));
  const years = officialYears(exam.id);
  return exam.about && years ? { exam, years } : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/about">): Promise<Metadata> {
  const about = await aboutOf(params);
  if (!about) return {};
  const { exam, years } = about;
  const [t, locale] = await Promise.all([
    getTranslations("ExamAbout"),
    getLocale(),
  ]);
  const faculty = facultyOf(exam.faculty);
  const [test] = examTests(exam.id);
  return {
    title: {
      absolute: t("metaTitle", {
        short: faculty.short,
        exam: exam.title,
        subject: test?.subject ?? "",
      }),
    },
    description: t("metaDescription", {
      exam: exam.title,
      short: faculty.short,
      city:
        locale === routing.defaultLocale ? faculty.cityLocative : faculty.city,
      tasks: exam.positions.length,
      hours: examHours(exam),
      points: String(exam.points),
      grading: exam.about?.grading ?? "",
      from: String(years.first),
      to: String(years.last),
    }),
    ...untranslated(`${exam.path}/about`, locale),
  };
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/about">) {
  const { exam, years } = (await aboutOf(params)) ?? notFound();
  const meta = await getTranslations("Metadata");
  const faculty = facultyOf(exam.faculty);

  return (
    <>
      <AboutView examId={exam.id} years={years} />
      <JsonLd
        data={breadcrumbList([
          { name: meta("title"), href: "/" },
          { name: faculty.short, href: `/${faculty.id}` },
          {
            name: `${exam.title} · ${exam.name}`,
            href: `${exam.path}/about`,
          },
        ])}
      />
    </>
  );
}
