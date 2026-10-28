import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SignInStrip } from "@/features/account/sign-in-strip";
import { minutesAt, positions } from "@/features/catalog/exams";
import { tasks } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import {
  accuracyBy,
  meanTimeByNumber,
  totals,
} from "@/features/progress/stats";
import { getTaskStats, getTaskTimes } from "@/features/progress/task-stats";
import { countTests, getTests } from "@/features/tests/finished-tests";
import { summarizeTests } from "@/features/tests/summaries";
import { minuteMs } from "@/lib/dates";
import { getSession } from "@/server/auth";
import { getProfileId } from "@/server/profile";
import { AccuracyCard } from "./accuracy-card";
import { BankCard } from "./bank-card";
import { RecentTests } from "./recent-tests";
import { TimeBars } from "./time-bars";
import { TotalsCard } from "./totals-card";

const recentTestCount = 5;

async function loadStats() {
  const profileId = await getProfileId();
  const [stats, times, recent, testCount] = await Promise.all([
    getTaskStats(profileId),
    getTaskTimes(profileId),
    getTests(profileId, recentTestCount),
    countTests(profileId),
  ]);
  return {
    byTask: stats.map((s) => ({ ...s, durationMs: times.get(s.taskId) ?? 0 })),
    testCount,
    tests: await summarizeTests(profileId, recent, await getLocale()),
  };
}

type Stats = Awaited<ReturnType<typeof loadStats>>;

export async function StatsView({
  searchParams,
}: Pick<PageProps<"/[locale]/stats">, "searchParams">) {
  const byNumber = (await searchParams).by === "number";
  const stats = await loadStats();
  const guest = !(await getSession());
  const strip = await getTranslations("SignInStrip");

  return (
    <div className="flex flex-col gap-6">
      {guest && (stats.byTask.length > 0 || stats.testCount > 0) && (
        <SignInStrip from="stats">{strip("stats")}</SignInStrip>
      )}
      <StatsCards byNumber={byNumber} stats={stats} />
    </div>
  );
}

export function StatsCards({
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
