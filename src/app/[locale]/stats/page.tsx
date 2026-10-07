import { getLocale, getTranslations } from "next-intl/server";
import { SignInCard } from "@/components/sign-in-card";
import { statAttempts } from "@/content/attempts";
import { positions } from "@/content/exam";
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
  const [rows, all] = await Promise.all([getAttempts(userId), getRuns(userId)]);
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

  const runs = await summarizeRuns(all.slice(0, 5), rows, locale);

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
        <TotalsCard totals={summary} runs={all.length} />
        <BankCard totals={summary} size={tasks.length} />
        <RecentRuns runs={runs} />
      </div>
    </div>
  );
}
