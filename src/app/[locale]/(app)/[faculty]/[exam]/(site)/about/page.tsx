import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { breadcrumbList, JsonLd } from "@/components/json-ld";
import { examAt, examRecord, examTests } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import { examPapers } from "@/features/variants/variants";
import { untranslated } from "@/i18n/alternates";
import { AboutView } from "./_components/about-view";

async function aboutOf(params: Promise<{ faculty: string; exam: string }>) {
  const exam = examRecord(examAt(await params));
  return exam.about ? exam : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/about">): Promise<Metadata> {
  const exam = await aboutOf(params);
  if (!exam) return {};
  const [t, locale] = await Promise.all([
    getTranslations("ExamAbout"),
    getLocale(),
  ]);
  const faculty = facultyOf(exam.faculty);
  const years = examPapers(exam.id).map((p) => p.year);
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
      cityLocative: faculty.cityLocative,
      tasks: exam.positions.length,
      hours: (exam.minutes ?? 0) / 60,
      points: String(exam.points),
      grading: exam.about?.grading ?? "",
      from: String(Math.min(...years)),
      to: String(Math.max(...years)),
    }),
    ...untranslated(`${exam.path}/about`, locale),
  };
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/about">) {
  const exam = (await aboutOf(params)) ?? notFound();
  const meta = await getTranslations("Metadata");
  const faculty = facultyOf(exam.faculty);

  return (
    <>
      <AboutView examId={exam.id} />
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
