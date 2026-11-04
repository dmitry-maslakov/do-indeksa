import { getLocale, getTranslations } from "next-intl/server";
import { regularity } from "@/features/progress/practice-days";
import { getPracticeSpans } from "@/features/progress/task-stats";
import { getTests } from "@/features/tests/finished-tests";
import { summarizeTests } from "@/features/tests/summaries";
import { Link } from "@/i18n/navigation";
import { dateIn, dayMs } from "@/lib/dates";
import { getProfileId } from "@/server/profile";

export async function StatsLine() {
  const [profileId, locale, t, home] = await Promise.all([
    getProfileId(),
    getLocale(),
    getTranslations("Stats"),
    getTranslations("Home"),
  ]);
  const now = Date.now();
  const [spans, tests] = await Promise.all([
    getPracticeSpans(profileId, new Date(now - 8 * dayMs)),
    getTests(profileId, 1),
  ]);
  const [last] = await summarizeTests(profileId, tests, locale);
  const tz = spans.at(-1)?.tz ?? null;
  const { streak } = regularity(spans, dateIn(now, tz), 1);
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
