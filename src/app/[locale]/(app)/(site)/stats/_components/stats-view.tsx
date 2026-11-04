import { getLocale, getTranslations } from "next-intl/server";
import { SignInStrip } from "@/features/account/sign-in-strip";
import { topicName } from "@/features/catalog/topics";
import {
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

const chartedTests = 8;

const listedTests = 4;

async function loadStats() {
  const [profileId, locale] = await Promise.all([getProfileId(), getLocale()]);
  const now = Date.now();
  const [recent, spans, days, zone, outcomes] = await Promise.all([
    getTests(profileId, chartedTests),
    getPracticeSpans(
      profileId,
      new Date(now - (practiceWeeks + 1) * 7 * dayMs),
    ),
    getPracticeDays(profileId),
    getZone(profileId),
    getTaskOutcomes(profileId, new Date(now - mistakeDays * dayMs)),
  ]);
  const tests = await summarizeTests(profileId, recent, locale);
  const since = now - practiceWeeks * 7 * dayMs;
  const today = dateIn(now, zone);
  return {
    charted: tests.filter((test) => test.finishedAt >= since).reverse(),
    listed: tests.slice(0, listedTests),
    regularity: regularity(spans, today, practiceWeeks),
    streak: streakOf(days, today),
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

export async function StatsView() {
  const [stats, session, strip] = await Promise.all([
    loadStats(),
    getSession(),
    getTranslations("SignInStrip"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {!session && !stats.empty && (
        <SignInStrip from="stats">{strip("stats")}</SignInStrip>
      )}
      <TestsCard charted={stats.charted} listed={stats.listed} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <RegularityCard regularity={stats.regularity} streak={stats.streak} />
        <MistakesCard rows={stats.mistakes} />
      </div>
    </div>
  );
}
