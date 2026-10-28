import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { SearchTabs } from "@/components/search-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { positions } from "@/features/catalog/exams";
import { topicLook, topicName } from "@/features/catalog/topics";
import { weakTopics } from "@/features/progress/progress";
import { getTaskStats } from "@/features/progress/task-stats";
import {
  curatedVariants,
  officialVariants,
} from "@/features/variants/variants";
import { alternates } from "@/i18n/alternates";
import { getProfileId } from "@/server/profile";
import { CatalogTab, tabs, VariantTable } from "./_components/catalog-tab";
import { ComposeCard } from "./_components/compose-card";
import { Weekly } from "./_components/weekly";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("variantsTitle"),
    description: t("variantsDescription"),
    alternates: alternates("/variants", await getLocale()),
  };
}

async function loadWeak() {
  return weakTopics(await getTaskStats(await getProfileId()));
}

export default async function VariantsPage({
  searchParams,
}: PageProps<"/[locale]/variants">) {
  const t = await getTranslations("Variants");
  const locale = await getLocale();
  const topics = positions.map((p) => ({
    id: p.topic,
    name: topicName(p.topic, locale),
    look: topicLook(p.topic),
  }));
  const counts = {
    official: officialVariants.length,
    curated: curatedVariants.length,
  };

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6 md:gap-5 md:px-10 md:pt-6 md:pb-8">
      <PageTitle>{t("title")}</PageTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_--spacing(85)]">
        <section className="flex min-w-0 flex-col gap-3">
          <SearchTabs
            variant="pill"
            param="tab"
            items={tabs.map((x) => ({
              href: x === "official" ? "/variants" : `/variants?tab=${x}`,
              label: x === "history" ? t(x) : t(x, { count: counts[x] }),
              value: x === "official" ? undefined : x,
            }))}
          />
          <Suspense fallback={<VariantTable tab="official" pending />}>
            <CatalogTab searchParams={searchParams} />
          </Suspense>
        </section>
        <aside className="contents lg:flex lg:flex-col lg:gap-5">
          <div className="max-lg:order-first">
            <Suspense fallback={<Skeleton className="h-62 rounded-xl" />}>
              <Weekly />
            </Suspense>
          </div>
          <ComposeCard topics={topics} weak={loadWeak()} />
        </aside>
      </div>
    </main>
  );
}
