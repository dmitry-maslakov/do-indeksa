import { getLocale, getTranslations } from "next-intl/server";
import { SignInStrip } from "@/features/account/sign-in-strip";
import { topicName } from "@/features/catalog/topics";
import {
  gridWeeks,
  practiceWeeks,
  regularity,
  streakOf,
} from "@/features/progress/practice-days";
import { getZone } from "@/features/progress/progress";
import {
  getPracticeDays,
  getPracticeSpans,
  getTaskOutcomes,
} from "@/features/progress/task-stats";
import { mistakeDays, topicMistakes } from "@/features/progress/topic-mistakes";
import { getTests } from "@/features/tests/finished-tests";
import { summarizeTests } from "@/features/tests/summaries";
import { dateIn, dayMs, toMinutes } from "@/lib/dates";
import { getSession } from "@/server/auth";
import { getProfileId } from "@/server/profile";
import { MistakesCard } from "./mistakes-card";
import { RegularityCard } from "./regularity-card";
import { TestsCard } from "./tests-card";

const listedTests = 6;

async function loadStats(examId: string) {
  const [profileId, locale] = await Promise.all([getProfileId(), getLocale()]);
  const now = Date.now();
  const [recent, spans, days, zone, outcomes] = await Promise.all([
    getTests(profileId, listedTests),
    getPracticeSpans(profileId, new Date(now - (gridWeeks + 1) * 7 * dayMs)),
    getPracticeDays(profileId),
    getZone(profileId),
    getTaskOutcomes(profileId, new Date(now - mistakeDays * dayMs)),
  ]);
  const tests = await summarizeTests(profileId, examId, recent, locale);
  const since = now - practiceWeeks * 7 * dayMs;
  const today = dateIn(now, zone);
  return {
    tests: tests.filter((test) => test.finishedAt >= since),
    regularity: regularity(spans, today, gridWeeks),
    streak: streakOf(days, today),
    today,
    mistakes: topicMistakes(outcomes).map((row) => ({
      topic: row.topic,
      name: topicName(row.topic, locale),
      tasks: row.tasks,
      wrong: row.wrong,
      minutes: toMinutes(row.meanMs),
    })),
    empty: tests.length === 0 && spans.length === 0,
  };
}

export async function StatsView({ examId }: { examId: string }) {
  const [stats, session, strip] = await Promise.all([
    loadStats(examId),
    getSession(),
    getTranslations("SignInStrip"),
  ]);

  return (
    <div className="flex flex-col gap-8 md:gap-6">
      {!session && !stats.empty && (
        <SignInStrip from="stats">{strip("stats")}</SignInStrip>
      )}
      <div className="grid items-start gap-8 md:gap-6 xl:grid-cols-2">
        <TestsCard tests={stats.tests} />
        <div className="flex flex-col gap-8 md:gap-6">
          <RegularityCard
            regularity={stats.regularity}
            streak={stats.streak}
            today={stats.today}
          />
          <MistakesCard rows={stats.mistakes} />
        </div>
      </div>
    </div>
  );
}
