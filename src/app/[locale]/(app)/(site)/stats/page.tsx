import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { practiceWeeks } from "@/features/progress/practice-days";
import { StatsSkeleton } from "./_components/stats-skeleton";
import { StatsView } from "./_components/stats-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Stats");
  return { title: t("title") };
}

export default async function StatsPage() {
  const t = await getTranslations("Stats");

  return (
    <main className="max-w-250 px-4 pb-10 md:px-10 md:pb-14">
      <div className="flex items-baseline gap-3 pt-4 pb-5 md:gap-4 md:pt-5 md:pb-6">
        <PageTitle>{t("title")}</PageTitle>
        <span className="text-[13px] text-subtle md:text-sm">
          {t("period", { weeks: practiceWeeks })}
        </span>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsView />
      </Suspense>
    </main>
  );
}
