import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";
import { Await } from "@/components/await";
import { DailyBanner } from "@/components/daily-banner";
import { PageTitle } from "@/components/page-title";
import { SearchTabs } from "@/components/search-tabs";
import { SignInCard } from "@/components/sign-in-card";
import { positions } from "@/content/exam";
import { summarizeRuns } from "@/content/runs";
import { topicName } from "@/content/topics";
import { curatedVariants, officialVariants } from "@/content/variants";
import { alternates } from "@/i18n/alternates";
import { getSession } from "@/server/auth";
import { getAttempts, getRuns } from "@/server/history";
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

async function loadRuns() {
  const session = await getSession();
  if (!session) return { signedIn: false, runs: [] };
  const [rows, attempts] = await Promise.all([
    getRuns(session.user.id),
    getAttempts(session.user.id),
  ]);
  return {
    signedIn: true,
    runs: await summarizeRuns(rows, attempts, await getLocale()),
  };
}

export default async function VariantsPage({
  searchParams,
}: PageProps<"/[locale]/variants">) {
  const t = await getTranslations("Variants");
  const locale = await getLocale();
  const runs = loadRuns();
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
          <CatalogTab searchParams={searchParams} runs={runs} />
        </Suspense>
        <aside className="flex flex-col gap-5">
          <ComposeCard topics={topics} />
          <Suspense>
            <Await promise={runs}>
              {(r) =>
                r.runs.length > 0 && <RecentCard runs={r.runs.slice(0, 3)} />
              }
            </Await>
          </Suspense>
        </aside>
      </div>
    </main>
  );
}

async function CatalogTab({
  searchParams,
  runs,
}: Pick<PageProps<"/[locale]/variants">, "searchParams"> & {
  runs: ReturnType<typeof loadRuns>;
}) {
  const t = await getTranslations("Variants");
  const { tab: raw } = await searchParams;
  const tab: Tab = tabs.find((x) => x === raw) ?? "official";
  const variants = tab === "official" ? officialVariants : curatedVariants;

  return (
    <Catalog>
      {tab === "history" ? (
        <Suspense fallback={<RunHistory />}>
          <Await promise={runs}>
            {(r) =>
              r.signedIn ? (
                <RunHistory runs={r.runs} />
              ) : (
                <SignInCard text={t("historyGuest")} />
              )
            }
          </Await>
        </Suspense>
      ) : (
        <Suspense fallback={<VariantList variants={variants} />}>
          <Await promise={runs}>
            {(r) => <VariantList variants={variants} runs={r.runs} />}
          </Await>
        </Suspense>
      )}
    </Catalog>
  );
}

function Catalog({ children }: { children: ReactNode }) {
  const t = useTranslations("Variants");
  const minutes = positions.reduce((sum, p) => sum + p.minutes, 0);

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
