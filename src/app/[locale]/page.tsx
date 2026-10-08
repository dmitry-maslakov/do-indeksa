import { DailyBanner } from "@/components/daily-banner";
import { statAttempts } from "@/content/attempts";
import { positions } from "@/content/exam";
import {
  curatedVariants,
  minutesOf,
  officialVariants,
} from "@/content/variants";
import { meanTimeByNumber, mistakesThisWeek, weakest } from "@/lib/stats";
import { getSession } from "@/server/auth";
import { getAttempts } from "@/server/history";
import { ContinueCard } from "./_components/continue-card";
import { EntryCards } from "./_components/entry-cards";
import { MistakesCard } from "./_components/mistakes-card";
import { TimeCard } from "./_components/time-card";
import { WeakTopics } from "./_components/weak-topics";

export default async function HomePage() {
  const session = await getSession();
  const attempts = session
    ? statAttempts(await getAttempts(session.user.id))
    : [];
  const now = new Date();
  const signedIn = Boolean(session);
  const [first] = [...officialVariants, ...curatedVariants];
  if (!first) throw new Error("no tests in the bank");
  const slowest = meanTimeByNumber(
    attempts,
    positions.map((p) => p.number),
  )
    .flatMap((row) =>
      row.meanMs === null
        ? []
        : {
            ...row,
            meanMs: row.meanMs,
            normMs: (positions[row.number - 1]?.minutes ?? 0) * 60_000,
          },
    )
    .sort((a, b) => b.meanMs / b.normMs - a.meanMs / a.normMs)
    .slice(0, 3);

  return (
    <main className="flex flex-col gap-6 px-4 py-6 pb-9 md:grid md:pt-2.5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start md:px-9">
      <div className="contents md:flex md:flex-col md:gap-6">
        <ContinueCard
          start={{
            id: first.id,
            title: first.title ?? String(first.year),
            tasks: first.taskIds.length,
            minutes: minutesOf(first),
          }}
        />
        <div className="max-md:order-1">
          <EntryCards />
        </div>
        <div className="max-md:order-1">
          <TimeCard rows={slowest} signedIn={signedIn} />
        </div>
      </div>
      <div className="contents md:flex md:flex-col md:gap-6">
        <DailyBanner />
        <WeakTopics
          topics={weakest(
            attempts,
            positions.map((p) => p.topic),
            now,
          )}
          signedIn={signedIn}
        />
        <MistakesCard
          taskIds={mistakesThisWeek(attempts, now)}
          signedIn={signedIn}
        />
      </div>
    </main>
  );
}
