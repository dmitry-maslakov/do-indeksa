import { sumBy } from "es-toolkit";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";
import { Await } from "@/components/await";
import { PageTitle } from "@/components/page-title";
import { SearchTabs } from "@/components/search-tabs";
import { SignInCard } from "@/features/account/sign-in-card";
import { DailyBanner } from "@/features/exam/daily-banner";
import { positions } from "@/features/exam/exam";
import { runPage } from "@/features/exam/run-feed";
import { type RunRow, summarizeRuns } from "@/features/exam/run-summaries";
import { curatedVariants, officialVariants } from "@/features/exam/variants";
import { getLatestRuns, getRuns } from "@/features/progress/history";
import { topicName } from "@/features/tasks/topics";
import { alternates } from "@/i18n/alternates";
import { getSession } from "@/server/auth";
import { ComposeCard } from "./_components/compose-card";
import { RecentCard } from "./_components/recent-card";
import { RunHistory } from "./_components/run-history";
import { VariantList } from "./_components/variant-list";

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

const recentRunCount = 3;

async function loadRuns(read: (userId: string) => PromiseLike<RunRow[]>) {
  const session = await getSession();
  if (!session) return [];
  return summarizeRuns(
    session.user.id,
    await read(session.user.id),
    await getLocale(),
  );
}

async function loadHistory() {
  const session = await getSession();
  return session && runPage(session.user.id, 0, await getLocale());
}

export default async function VariantsPage({
  searchParams,
}: PageProps<"/[locale]/variants">) {
  const t = await getTranslations("Variants");
  const locale = await getLocale();
  const recent = loadRuns((userId) => getRuns(userId, recentRunCount));
  const topics = positions.map((p) => ({
    id: p.topic,
    name: topicName(p.topic, locale),
  }));

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{t("title")}</PageTitle>
      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
        <DailyBanner />
        <Suspense
          fallback={
            <Catalog>
              <RunHistory />
            </Catalog>
          }
        >
          <CatalogTab searchParams={searchParams} />
        </Suspense>
        <aside className="flex flex-col gap-5">
          <ComposeCard topics={topics} />
          <Suspense>
            <Await promise={recent}>
              {(runs) => runs.length > 0 && <RecentCard runs={runs} />}
            </Await>
          </Suspense>
        </aside>
      </div>
    </main>
  );
}

async function CatalogTab({
  searchParams,
}: Pick<PageProps<"/[locale]/variants">, "searchParams">) {
  const t = await getTranslations("Variants");
  const { tab: raw } = await searchParams;
  const tab: Tab = tabs.find((x) => x === raw) ?? "official";
  const variants = tab === "official" ? officialVariants : curatedVariants;
  const ids = variants.map((v) => v.id);

  return (
    <Catalog>
      {tab === "history" ? (
        <Suspense fallback={<RunHistory />}>
          <Await promise={loadHistory()}>
            {(first) =>
              first ? (
                <RunHistory first={first} />
              ) : (
                <SignInCard text={t("historyGuest")} />
              )
            }
          </Await>
        </Suspense>
      ) : (
        <Suspense fallback={<VariantList variants={variants} />}>
          <Await promise={loadRuns((userId) => getLatestRuns(userId, ids))}>
            {(runs) => <VariantList variants={variants} runs={runs} />}
          </Await>
        </Suspense>
      )}
    </Catalog>
  );
}

function Catalog({ children }: { children: ReactNode }) {
  const t = useTranslations("Variants");
  const minutes = sumBy(positions, (p) => p.minutes);

  return (
    <div className="flex flex-col gap-3.5 md:col-start-1 md:row-span-2 md:row-start-1">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <SearchTabs
          variant="underline"
          param="tab"
          items={tabs.map((x) => ({
            href: x === "official" ? "/variants" : `/variants?tab=${x}`,
            label: t(x),
            value: x === "official" ? undefined : x,
          }))}
        />
        <span className="text-[13px] text-subtle">
          {t("format", { tasks: positions.length, minutes })}
        </span>
      </div>
      {children}
    </div>
  );
}
