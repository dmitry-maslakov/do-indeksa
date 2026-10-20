import { DailyBanner } from "@/features/exam/daily-banner";
import { contentVariants, minutesOf } from "@/features/exam/variants";
import { AccountNote } from "./account-note";
import { ContinueCard } from "./continue-card";
import { EntryCards } from "./entry-cards";
import { Intro } from "./intro";

export function GuestHome() {
  const [first] = contentVariants;
  if (!first) throw new Error("no tests in the bank");
  const start = {
    id: first.id,
    title: first.title,
    tasks: first.taskIds.length,
    minutes: minutesOf(first),
  };

  return (
    <main className="flex flex-col gap-6 px-4 py-6 pb-9 md:grid md:pt-2 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start md:px-10">
      <Intro />
      <div className="contents md:flex md:flex-col md:gap-6">
        <div className="max-md:order-2">
          <ContinueCard start={start} />
        </div>
        <div className="max-md:order-3">
          <EntryCards />
        </div>
      </div>
      <div className="contents md:flex md:flex-col md:gap-6">
        <div className="max-md:order-1">
          <DailyBanner />
        </div>
        <div className="max-md:order-4">
          <AccountNote />
        </div>
      </div>
    </main>
  );
}
