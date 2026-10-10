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
  mistakesThisWeek,
  type StatAttempt,
  weakest,
} from "@/lib/stats";
import { getSession } from "@/server/auth";
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
  const [first] = [...officialVariants, ...curatedVariants];
  if (!first) throw new Error("no tests in the bank");

  return (
    <main className="flex flex-col gap-6 px-4 py-6 pb-9 md:grid md:pt-2.5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start md:px-9">
      <Intro />
      <div className="contents md:flex md:flex-col md:gap-6">
        <ContinueCard
          start={{
            id: first.id,
            title: first.title,
            tasks: first.taskIds.length,
            minutes: minutesOf(first),
          }}
        />
        <div className="max-md:order-1">
          <EntryCards />
        </div>
        <div className="empty:hidden max-md:order-1">
          <Suspense fallback={<TimeCard />}>
            <Await promise={stats}>
              {(s) => s.signedIn && <TimeCard rows={slowest(s.attempts)} />}
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="contents md:flex md:flex-col md:gap-6">
        <DailyBanner />
        <div className="flex flex-col gap-6">
          <Suspense
            fallback={
              <>
                <WeakTopics />
                <MistakesCard />
              </>
            }
          >
            <Await promise={stats}>
              {(s) =>
                s.signedIn ? (
                  <>
                    <WeakTopics
                      topics={weakest(
                        s.attempts,
                        positions.map((p) => p.topic),
                        new Date(),
                      )}
                    />
                    <MistakesCard
                      taskIds={mistakesThisWeek(s.attempts, new Date())}
                    />
                  </>
                ) : (
                  <AccountNote />
                )
              }
            </Await>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
