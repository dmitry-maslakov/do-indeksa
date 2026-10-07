import type { Variant } from "content-collections";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { DailyBanner } from "@/components/daily-banner";
import { SignInCard } from "@/components/sign-in-card";
import { Card } from "@/components/ui/card";
import { VariantRow } from "@/components/variant-row";
import { VariantStrip } from "@/components/variant-strip";
import { dailySize, positions } from "@/content/exam";
import { type RunSummary, summarizeRuns } from "@/content/runs";
import { topicName } from "@/content/topics";
import { curatedVariants, officialVariants } from "@/content/variants";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth";
import { getAttempts, getRuns } from "@/server/history";
import { ComposeCard } from "./_components/compose-card";
import { VariantTabs } from "./_components/variant-tabs";

const tabs = ["official", "curated", "history"] as const;
type Tab = (typeof tabs)[number];

export default async function VariantsPage({
  searchParams,
}: PageProps<"/[locale]/variants">) {
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
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <VariantTabs tabs={tabs} current={tab} />
            <span className="text-sm text-subtle">
              {t("format", { tasks: positions.length, minutes })}
            </span>
          </div>
          {tab === "history" ? (
            session ? (
              <History runs={runs} />
            ) : (
              <SignInCard text={t("historyGuest")} />
            )
          ) : (
            <Rows
              variants={tab === "official" ? officialVariants : curatedVariants}
              runs={runs}
            />
          )}
        </div>
        <aside className="order-first flex flex-col gap-5 md:order-none">
          <DailyBanner tasks={dailySize} />
          <ComposeCard
            minutes={minutes}
            topics={positions.map((p) => ({
              id: p.topic,
              name: topicName(p.topic, locale),
            }))}
          />
          {runs.length > 0 && <Recent runs={runs.slice(0, 3)} />}
        </aside>
      </div>
    </main>
  );
}

function Rows({ variants, runs }: { variants: Variant[]; runs: RunSummary[] }) {
  return (
    <Card className="p-0 md:p-0">
      <ul className="divide-y divide-subtle/15 py-1.5">
        {variants.map((v) => {
          const latest = runs.find((r) => r.variantId === v.id);
          return (
            <VariantRow
              key={v.id}
              id={v.id}
              title={v.title ?? String(v.year)}
              tasks={v.taskIds.length}
              latest={
                latest && {
                  runId: latest.id,
                  segments: latest.segments,
                  score: latest.score,
                  max: latest.max,
                }
              }
            />
          );
        })}
      </ul>
    </Card>
  );
}

async function History({ runs }: { runs: RunSummary[] }) {
  const t = await getTranslations("Variants");
  const format = await getFormatter();
  if (runs.length === 0) {
    return (
      <Card>
        <p className="text-sm text-subtle">{t("historyEmpty")}</p>
      </Card>
    );
  }
  return (
    <Card className="p-0 md:p-0">
      <ul className="divide-y divide-subtle/15 py-1.5">
        {runs.map((run) => (
          <li key={run.id}>
            <Link
              href={`/review?run=${run.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-sm hover:bg-muted/50 md:grid-cols-[150px_minmax(0,1fr)_72px] md:px-6"
            >
              <span className="flex flex-col">
                <span className="truncate font-semibold">{run.title}</span>
                <span className="text-subtle text-xs">
                  {format.dateTime(run.finishedAt, {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </span>
              <VariantStrip
                segments={run.segments}
                label={t("strip", { count: run.segments.length })}
                className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto"
              />
              <span className="text-right text-[13px]">
                <b className="font-semibold">{run.score}</b>{" "}
                <span className="text-subtle">/ {run.max}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function Recent({ runs }: { runs: RunSummary[] }) {
  const t = await getTranslations("Variants");
  return (
    <Card className="gap-3">
      <span className="font-semibold text-sm text-subtle">{t("recent")}</span>
      <ul className="flex flex-col gap-2 text-sm">
        {runs.map((run) => (
          <li key={run.id}>
            <Link
              href={`/review?run=${run.id}`}
              className="flex justify-between gap-3 hover:text-data"
            >
              <span className="truncate">{run.title}</span>
              <b className="font-semibold">
                {run.score} / {run.max}
              </b>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
