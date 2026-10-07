import { getLocale, getTranslations } from "next-intl/server";
import { SignInCard } from "@/components/sign-in-card";
import { variantTitle } from "@/components/variant-title";
import { statAttempts } from "@/content/attempts";
import { positions } from "@/content/exam";
import { tasks } from "@/content/tasks";
import { topicName } from "@/content/topics";
import { getVariant, tasksFor } from "@/content/variants";
import { review } from "@/lib/review";
import { accuracyBy, meanTimeByNumber, totals } from "@/lib/stats";
import { getSession } from "@/server/auth";
import { getAttempts, getRecentRuns, getRunCount } from "@/server/history";
import { AccuracyCard } from "./_components/accuracy-card";
import { BankCard } from "./_components/bank-card";
import { RecentRuns } from "./_components/recent-runs";
import { TimeBars } from "./_components/time-bars";
import { TotalsCard } from "./_components/totals-card";

export default async function StatsPage({
  searchParams,
}: PageProps<"/[locale]/stats">) {
  const t = await getTranslations("Stats");
  const session = await getSession();

  return (
    <main className="px-4 pb-9 md:px-9">
      <h1 className="py-6 font-bold text-3xl">{t("title")}</h1>
      {session ? (
        <Stats
          userId={session.user.id}
          byNumber={(await searchParams).by === "number"}
        />
      ) : (
        <SignInCard text={t("guest")} />
      )}
    </main>
  );
}

async function Stats({
  userId,
  byNumber,
}: {
  userId: string;
  byNumber: boolean;
}) {
  const locale = await getLocale();
  const [rows, recent, runCount] = await Promise.all([
    getAttempts(userId),
    getRecentRuns(userId),
    getRunCount(userId),
  ]);
  const attempts = statAttempts(rows);
  const summary = totals(attempts);
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

  const runs = await Promise.all(
    recent.map(async (run) => {
      const variant = getVariant(run.variantId);
      const result = review(
        tasksFor(run.taskIds, locale).map((task) => ({
          ...task,
          taskId: task.id,
        })),
        rows.filter((r) => r.runId === run.id),
      );
      return {
        id: run.id,
        title: variant ? await variantTitle(variant) : run.variantId,
        segments: result.rows.map((r) => r.segment),
        score: result.score,
      };
    }),
  );

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <AccuracyCard rows={accuracy} byNumber={byNumber} />
        <TimeBars
          bars={meanTimeByNumber(attempts, numbers).map((bar) => ({
            ...bar,
            normMs: (positions[bar.number - 1]?.minutes ?? 0) * 60_000,
          }))}
        />
      </div>
      <div className="flex flex-col gap-5">
        <TotalsCard totals={summary} runs={runCount} />
        <BankCard totals={summary} size={tasks.length} />
        <RecentRuns runs={runs} />
      </div>
    </div>
  );
}
