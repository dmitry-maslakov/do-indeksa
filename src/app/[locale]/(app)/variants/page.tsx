import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { SearchTabs } from "@/components/search-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { durationHours, maxPoints, positions } from "@/features/exam/exam";
import { testPage } from "@/features/exam/test-feed";
import {
  summarizeTests,
  type TestSummary,
} from "@/features/exam/test-summaries";
import { curatedVariants, officialVariants } from "@/features/exam/variants";
import { weeklyVariant } from "@/features/exam/weekly";
import { getLatestTests, getTaskStats } from "@/features/progress/history";
import { weakTopics } from "@/features/progress/progress";
import { topicLook, topicName } from "@/features/tasks/topics";
import { alternates } from "@/i18n/alternates";
import { getProfileId } from "@/server/auth";
import { ComposeCard } from "./_components/compose-card";
import { ExamRow } from "./_components/exam-row";
import { TestHistory } from "./_components/test-history";
import { TestsTable } from "./_components/tests-table";
import { WeekCard } from "./_components/week-card";

const tabs = ["official", "curated", "history"] as const;
type Tab = (typeof tabs)[number];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("variantsTitle"),
    description: t("variantsDescription"),
    alternates: alternates("/variants", await getLocale()),
  };
}

async function loadLatest(ids: string[]) {
  const profileId = await getProfileId();
  return summarizeTests(
    profileId,
    await getLatestTests(profileId, ids),
    await getLocale(),
  );
}

async function loadHistory() {
  return testPage(await getProfileId(), 0, await getLocale());
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
        <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <span className="text-sm text-subtle">
          {t("meta", {
            tasks: positions.length,
            hours: durationHours,
            points: maxPoints,
          })}
        </span>
      </div>
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

async function Weekly() {
  await connection();
  const weekly = weeklyVariant();
  if (!weekly) return null;
  const tests = await loadLatest([weekly.id]);
  const test = tests.find(
    (r) => weeklyVariant(new Date(r.finishedAt))?.week === weekly.week,
  );
  return <WeekCard {...weekly} test={test} />;
}

async function CatalogTab({
  searchParams,
}: Pick<PageProps<"/[locale]/variants">, "searchParams">) {
  const { tab: raw } = await searchParams;
  const tab: Tab = tabs.find((x) => x === raw) ?? "official";

  if (tab === "history") {
    return (
      <Suspense fallback={<TestsTable first="attempt">{null}</TestsTable>}>
        <Await promise={loadHistory()}>
          {(first) => <TestHistory first={first} />}
        </Await>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<VariantTable tab={tab} pending />}>
      <Await promise={loadLatest(variantsOf(tab).map((v) => v.id))}>
        {(tests) => <VariantTable tab={tab} tests={tests} />}
      </Await>
    </Suspense>
  );
}

const variantsOf = (tab: Exclude<Tab, "history">) =>
  tab === "official" ? officialVariants : curatedVariants;

function VariantTable({
  tab,
  tests = [],
  pending,
}: {
  tab: Exclude<Tab, "history">;
  tests?: TestSummary[];
  pending?: boolean;
}) {
  return (
    <TestsTable first={tab === "official" ? "year" : "test"}>
      {variantsOf(tab).map((v) => (
        <ExamRow
          key={v.id}
          title={v.title}
          href={`/variants/${v.id}`}
          test={tests.find((r) => r.variantId === v.id)}
          pending={pending}
        />
      ))}
    </TestsTable>
  );
}
