import { useLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { PageTitle } from "@/components/page-title";
import { SignInCard } from "@/components/sign-in-card";
import { statAttempts } from "@/content/attempts";
import { minutesAt, positions } from "@/content/exam";
import { summarizeRuns } from "@/content/runs";
import { tasks } from "@/content/tasks";
import { topicName } from "@/content/topics";
import { accuracyBy, meanTimeByNumber, totals } from "@/lib/stats";
import { getSession } from "@/server/auth";
import { getAttempts, getRuns } from "@/server/history";
import { AccuracyCard } from "./_components/accuracy-card";
import { BankCard } from "./_components/bank-card";
import { RecentRuns } from "./_components/recent-runs";
import { TimeBars } from "./_components/time-bars";
import { TotalsCard } from "./_components/totals-card";

async function loadStats() {
  const session = await getSession();
  if (!session) return undefined;
  const [rows, all] = await Promise.all([
    getAttempts(session.user.id),
    getRuns(session.user.id),
  ]);
  return {
    attempts: statAttempts(rows),
    runCount: all.length,
    runs: await summarizeRuns(all.slice(0, 5), rows, await getLocale()),
  };
}

type Stats = NonNullable<Awaited<ReturnType<typeof loadStats>>>;

export default async function StatsPage({
  searchParams,
}: PageProps<"/[locale]/stats">) {
  const t = await getTranslations("Stats");
  const byNumber = (await searchParams).by === "number";

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{t("title")}</PageTitle>
      <Suspense fallback={<StatsCards byNumber={byNumber} />}>
        <Await promise={loadStats()}>
          {(stats) =>
            stats ? (
              <StatsCards byNumber={byNumber} stats={stats} />
            ) : (
              <SignInCard text={t("guest")} />
            )
          }
        </Await>
      </Suspense>
    </main>
  );
}

function StatsCards({ byNumber, stats }: { byNumber: boolean; stats?: Stats }) {
  const locale = useLocale();
  const attempts = stats?.attempts ?? [];
  const numbers = positions.map((p) => p.number);
  const accuracy = byNumber
    ? accuracyBy(attempts, numbers, (a) => a.number).map((a) => ({
        ...a,
        label: `№${a.key}`,
      }))
    : accuracyBy(
        attempts,
        positions.map((p) => p.topic),
        (a) => a.topic,
      ).map((a) => ({ ...a, label: topicName(String(a.key), locale) }));
  const summary = stats && totals(attempts);

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <AccuracyCard rows={accuracy} byNumber={byNumber} pending={!stats} />
        <TimeBars
          bars={meanTimeByNumber(attempts, numbers).map((bar) => ({
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
