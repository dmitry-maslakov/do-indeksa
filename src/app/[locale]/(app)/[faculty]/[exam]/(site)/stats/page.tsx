import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { examAt } from "@/features/catalog/exams";
import { StatsSkeleton } from "./_components/stats-skeleton";
import { StatsView } from "./_components/stats-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Stats");
  return { title: t("title") };
}

export default async function StatsPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/stats">) {
  const t = await getTranslations("Stats");
  const examId = examAt(await params);

  return (
    <main className="px-4 pb-10 md:px-10 md:pb-14">
      <div className="pt-4 pb-5 md:pt-5 md:pb-6">
        <PageTitle>{t("title")}</PageTitle>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsView examId={examId} />
      </Suspense>
    </main>
  );
}
