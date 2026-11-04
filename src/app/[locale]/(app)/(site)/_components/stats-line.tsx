import { getLocale, getTranslations } from "next-intl/server";
import { streakOf } from "@/features/progress/practice-days";
import { getZone } from "@/features/progress/progress";
import { getPracticeDays } from "@/features/progress/task-stats";
import { getTests } from "@/features/tests/finished-tests";
import { summarizeTests } from "@/features/tests/summaries";
import { Link } from "@/i18n/navigation";
import { dateIn } from "@/lib/dates";
import { getProfileId } from "@/server/profile";

export async function StatsLine() {
  const [profileId, locale, t, home] = await Promise.all([
    getProfileId(),
    getLocale(),
    getTranslations("Stats"),
    getTranslations("Home"),
  ]);
  const [days, zone, tests] = await Promise.all([
    getPracticeDays(profileId),
    getZone(profileId),
    getTests(profileId, 1),
  ]);
  const [last] = await summarizeTests(profileId, tests, locale);
  const streak = streakOf(days, dateIn(Date.now(), zone));
  const parts = [
    streak > 0 && t("streak", { count: streak }),
    last && t("lastTest", { score: last.score, max: last.max }),
  ].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <Link
      href="/stats"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-sm text-muted-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {parts.join(" · ")}
      <span className="font-semibold text-data">{home("stats")}</span>
    </Link>
  );
}
