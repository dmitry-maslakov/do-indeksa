import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { DailyBanner } from "@/components/daily-banner";
import { minutesAt, positions } from "@/content/exam";
import {
  curatedVariants,
  minutesOf,
  officialVariants,
} from "@/content/variants";
import {
  meanTimeByNumber,
  mistakes,
  type StatAttempt,
  warming,
  weakest,
} from "@/lib/stats";
import { getSession } from "@/server/auth";
import { getCurrentRun } from "@/server/current-run";
import { getStatAttempts } from "@/server/history";
import { AccountNote } from "./_components/account-note";
import { ContinueCard } from "./_components/continue-card";
import { EntryCards } from "./_components/entry-cards";
import { Intro } from "./_components/intro";
import { MistakesCard } from "./_components/mistakes-card";
import { TimeCard } from "./_components/time-card";
import { WeakTopics } from "./_components/weak-topics";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: { absolute: t("homeTitle") }, description: t("description") };
}

async function loadStats() {
  const session = await getSession();
  return {
    signedIn: Boolean(session),
    attempts: session ? await getStatAttempts(session.user.id) : [],
  };
}

async function loadCurrentRun() {
  const session = await getSession();
  return session ? getCurrentRun(session.user.id) : undefined;
}

const topics = positions.map((p) => p.topic);

const slowest = (attempts: StatAttempt[]) =>
  meanTimeByNumber(
    attempts,
    positions.map((p) => p.number),
  )
    .flatMap((row) =>
      row.meanMs === null
        ? []
        : {
            ...row,
            meanMs: row.meanMs,
            normMs: minutesAt(row.number) * 60_000,
          },
    )
    .sort((a, b) => b.meanMs / b.normMs - a.meanMs / a.normMs)
    .slice(0, 3);

export default function HomePage() {
  const stats = loadStats();
  const current = loadCurrentRun();
  const [first] = [...officialVariants, ...curatedVariants];
  if (!first) throw new Error("no tests in the bank");
  const start = {
    id: first.id,
    title: first.title,
    tasks: first.taskIds.length,
    minutes: minutesOf(first),
  };

  return (
    <main className="flex flex-col gap-6 px-4 py-6 pb-9 md:grid md:pt-2.5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start md:px-9">
      <Intro />
      <div className="contents md:flex md:flex-col md:gap-6">
        <div className="max-md:order-2">
          <Suspense fallback={<ContinueCard start={start} />}>
            <Await promise={current}>
              {(account) => <ContinueCard start={start} account={account} />}
            </Await>
          </Suspense>
        </div>
        <div className="max-md:order-3">
          <EntryCards />
        </div>
        <div className="empty:hidden max-md:order-5">
          <Suspense fallback={<TimeCard />}>
            <Await promise={stats}>
              {(s) =>
                s.attempts.length > 0 && <TimeCard rows={slowest(s.attempts)} />
              }
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="contents md:flex md:flex-col md:gap-6">
        <div className="max-md:order-1">
          <DailyBanner />
        </div>
        <div className="flex flex-col gap-6 max-md:order-4">
          <Suspense
            fallback={
              <>
                <WeakTopics />
                <MistakesCard />
              </>
            }
          >
            <Await promise={stats}>
              {(s) => {
                if (!s.signedIn) return <AccountNote />;
                const now = new Date();
                return (
                  <>
                    <WeakTopics
                      topics={weakest(s.attempts, topics, now)}
                      warming={warming(s.attempts, topics, now)}
                    />
                    {s.attempts.length > 0 && (
                      <MistakesCard taskIds={mistakes(s.attempts)} />
                    )}
                  </>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
