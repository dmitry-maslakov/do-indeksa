import { getLocale, getTranslations } from "next-intl/server";
import { DailyBanner } from "@/components/daily-banner";
import { LinkTabs } from "@/components/link-tabs";
import { SignInCard } from "@/components/sign-in-card";
import { positions } from "@/content/exam";
import { summarizeRuns } from "@/content/runs";
import { topicName } from "@/content/topics";
import {
  belgradeDate,
  curatedVariants,
  getVariant,
  minutesOf,
  officialVariants,
} from "@/content/variants";
import { getSession } from "@/server/auth";
import { getAttempts, getRuns } from "@/server/history";
import { ComposeCard } from "./_components/compose-card";
import { RecentCard } from "./_components/recent-card";
import { RunHistory } from "./_components/run-history";
import { VariantList } from "./_components/variant-list";

const tabs = ["official", "curated", "history"] as const;
type Tab = (typeof tabs)[number];

export default async function VariantsPage({
  searchParams,
}: PageProps<"/[locale]/variants">) {
  const daily = getVariant(`daily-${belgradeDate()}`);
  if (!daily) throw new Error("no daily test");
  const t = await getTranslations("Variants");
  const { tab: raw } = await searchParams;
  const tab: Tab = tabs.find((x) => x === raw) ?? "official";
  const session = await getSession();
  const locale = await getLocale();
  const runs = session
    ? await summarizeRuns(
        await getRuns(session.user.id),
        await getAttempts(session.user.id),
        locale,
      )
    : [];
  const minutes = positions.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <main className="px-4 pb-9 md:px-9">
      <h1 className="py-6 font-bold text-3xl">{t("title")}</h1>
      <div className="grid items-start gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
        <DailyBanner tasks={daily.taskIds.length} minutes={minutesOf(daily)} />
        <div className="flex flex-col gap-3.5 md:col-start-1 md:row-span-2 md:row-start-1">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <LinkTabs
              variant="underline"
              items={tabs.map((x) => ({
                href: x === "official" ? "/variants" : `/variants?tab=${x}`,
                label: t(x),
                active: x === tab,
              }))}
            />
            <span className="text-sm text-subtle">
              {t("format", { tasks: positions.length, minutes })}
            </span>
          </div>
          {tab === "history" ? (
            session ? (
              <RunHistory runs={runs} />
            ) : (
              <SignInCard text={t("historyGuest")} />
            )
          ) : (
            <VariantList
              variants={tab === "official" ? officialVariants : curatedVariants}
              runs={runs}
            />
          )}
        </div>
        <aside className="flex flex-col gap-5">
          <ComposeCard
            minutes={minutes}
            topics={positions.map((p) => ({
              id: p.topic,
              name: topicName(p.topic, locale),
            }))}
          />
          {runs.length > 0 && <RecentCard runs={runs.slice(0, 3)} />}
        </aside>
      </div>
    </main>
  );
}
