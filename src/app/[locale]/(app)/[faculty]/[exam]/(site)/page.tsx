import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { examAt, examOf } from "@/features/catalog/exams";
import { currentWeekly } from "@/features/variants/weekly";
import { alternates } from "@/i18n/alternates";
import { Home } from "./_components/home";
import { OneTapGate } from "./_components/one-tap-gate";
import { loadHome } from "./_components/personal";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]">): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const exam = examOf(examAt(await params));
  return {
    title: {
      absolute: t("examHomeTitle", {
        faculty: exam.facultyShort,
        exam: exam.title,
      }),
    },
    description: t("description"),
    alternates: alternates(exam.path, await getLocale()),
  };
}

export default async function HomePage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]">) {
  const examId = examAt(await params);
  const weekly = await currentWeekly(examId);

  return (
    <>
      <Home
        examId={examId}
        weekly={weekly}
        personal={loadHome(examId, weekly)}
      />
      <Suspense>
        <OneTapGate />
      </Suspense>
    </>
  );
}
