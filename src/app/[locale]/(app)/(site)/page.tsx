import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { firstOpenExam } from "@/features/catalog/exams";
import { currentWeekly } from "@/features/variants/weekly";
import { alternates } from "@/i18n/alternates";
import { Home } from "./_components/home";
import { OneTapGate } from "./_components/one-tap-gate";
import { loadHome } from "./_components/personal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { absolute: t("homeTitle") },
    description: t("description"),
    alternates: alternates("/", await getLocale()),
  };
}

export default async function HomePage() {
  const examId = firstOpenExam();
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
