import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { SignInCard } from "@/features/account/sign-in-card";
import { minutesAt, positions } from "@/features/exam/exam";
import { summarizeRuns } from "@/features/exam/run-summaries";
import {
  countRuns,
  getRecentRuns,
  getRunAttempts,
  getTaskStats,
} from "@/features/progress/history";
import {
  accuracyBy,
  meanTimeByNumber,
  totals,
} from "@/features/progress/stats";
import { tasks } from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { getSession } from "@/server/auth";
import { AccuracyCard } from "./_components/accuracy-card";
import { BankCard } from "./_components/bank-card";
import { RecentRuns } from "./_components/recent-runs";
import { TimeBars } from "./_components/time-bars";
import { TotalsCard } from "./_components/totals-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Stats");
  return { title: t("title") };
}

const recentRunCount = 5;

async function loadStats() {
  const session = await getSession();
  if (!session) return undefined;
  const userId = session.user.id;
  const [byTask, recent, runCount] = await Promise.all([
    getTaskStats(userId),
    getRecentRuns(userId, recentRunCount),
    countRuns(userId),
  ]);
  return {
    byTask,
    runCount,
    runs: await summarizeRuns(
      recent,
      await getRunAttempts(
        userId,
        recent.map((run) => run.id),
      ),
      await getLocale(),
    ),
  };
}

type Stats = NonNullable<Awaited<ReturnType<typeof loadStats>>>;

export default async function StatsPage({
  searchParams,
}: PageProps<"/[locale]/stats">) {
  const t = await getTranslations("Stats");

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{t("title")}</PageTitle>
      <Suspense fallback={<StatsCards />}>
        <StatsView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StatsView({
  searchParams,
}: Pick<PageProps<"/[locale]/stats">, "searchParams">) {
  const t = await getTranslations("Stats");
  const byNumber = (await searchParams).by === "number";
  const stats = await loadStats();

  return stats ? (
    <StatsCards byNumber={byNumber} stats={stats} />
  ) : (
    <SignInCard text={t("guest")} />
  );
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
            normMs: minutesAt(bar.number) * 60_000,
          }))}
          pending={!stats}
        />
      </div>
      <div className="flex flex-col gap-5">
        <TotalsCard totals={summary} runs={stats?.runCount} />
        <BankCard totals={summary} size={tasks.length} />
        <RecentRuns runs={stats?.runs} />
      </div>
    </div>
  );
}
