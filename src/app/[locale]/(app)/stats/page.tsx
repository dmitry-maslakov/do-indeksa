import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { minutesAt, positions } from "@/features/catalog/exams";
import { tasks } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import { getTaskStats } from "@/features/progress/history";
import {
  accuracyBy,
  meanTimeByNumber,
  totals,
} from "@/features/progress/stats";
import { countTests, getTests } from "@/features/tests/history";
import { summarizeTests } from "@/features/tests/summaries";
import { minuteMs } from "@/lib/dates";
import { getProfileId } from "@/server/profile";
import { AccuracyCard } from "./_components/accuracy-card";
import { BankCard } from "./_components/bank-card";
import { RecentTests } from "./_components/recent-tests";
import { TimeBars } from "./_components/time-bars";
import { TotalsCard } from "./_components/totals-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Stats");
  return { title: t("title") };
}

const recentTestCount = 5;

async function loadStats() {
  const profileId = await getProfileId();
  const [byTask, recent, testCount] = await Promise.all([
    getTaskStats(profileId),
    getTests(profileId, recentTestCount),
    countTests(profileId),
  ]);
  return {
    byTask,
    testCount,
    tests: await summarizeTests(profileId, recent, await getLocale()),
  };
}

type Stats = Awaited<ReturnType<typeof loadStats>>;

export default async function StatsPage({
  searchParams,
}: PageProps<"/[locale]/stats">) {
  const t = await getTranslations("Stats");

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle className="pt-4 pb-5">{t("title")}</PageTitle>
      <Suspense fallback={<StatsCards />}>
        <StatsView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StatsView({
  searchParams,
}: Pick<PageProps<"/[locale]/stats">, "searchParams">) {
  const byNumber = (await searchParams).by === "number";
  return <StatsCards byNumber={byNumber} stats={await loadStats()} />;
}

function StatsCards({
  byNumber,
  stats,
}: {
  byNumber?: boolean;
  stats?: Stats;
}) {
  const locale = useLocale();
  const exam = useTranslations("Exam");
  const byTask = stats?.byTask ?? [];
  const numbers = positions.map((p) => p.number);
  const accuracy = byNumber
    ? accuracyBy(byTask, numbers, (s) => s.number).map((a) => ({
        ...a,
        label: exam("task", { number: Number(a.key) }),
      }))
    : accuracyBy(
        byTask,
        positions.map((p) => p.topic),
        (s) => s.topic,
      ).map((a) => ({ ...a, label: topicName(String(a.key), locale) }));
  const summary = stats && totals(byTask);

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <AccuracyCard rows={accuracy} pending={!stats} />
        <TimeBars
          bars={meanTimeByNumber(byTask, numbers).map((bar) => ({
            ...bar,
            normMs: minutesAt(bar.number) * minuteMs,
          }))}
          pending={!stats}
        />
      </div>
      <div className="flex flex-col gap-5">
        <TotalsCard totals={summary} tests={stats?.testCount} />
        <BankCard totals={summary} size={tasks.length} />
        <RecentTests tests={stats?.tests} />
      </div>
    </div>
  );
}
