import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { StatsCards, StatsView } from "./_components/stats-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Stats");
  return { title: t("title") };
}

export default async function StatsPage() {
  const t = await getTranslations("Stats");

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle className="pt-4 pb-5">{t("title")}</PageTitle>
      <Suspense fallback={<StatsCards />}>
        <StatsView />
      </Suspense>
    </main>
  );
}
