import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { EmptyNote } from "@/components/empty-note";
import { reviewHref } from "@/features/tests/review";
import type { TestSummary } from "@/features/tests/summaries";
import { Link } from "@/i18n/navigation";
import { toMinutes } from "@/lib/dates";

const tags = {
  b: (chunks: ReactNode) => <b className="text-foreground">{chunks}</b>,
};

function Delta({
  last,
  previous,
}: {
  last: TestSummary;
  previous?: TestSummary;
}) {
  const t = useTranslations("Stats");
  if (!previous || previous.max !== last.max) return null;
  const delta = Math.round((last.score - previous.score) * 10) / 10;
  const sign = delta > 0 ? "up" : delta < 0 ? "down" : "same";
  return (
    <span className="text-muted-foreground text-sm">
      {t.rich("delta", { sign, delta: Math.abs(delta), ...tags })}
    </span>
  );
}

function Chart({ tests }: { tests: TestSummary[] }) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const last = tests.length - 1;

  return (
    <div role="img" aria-label={t("chart")} className="flex flex-col gap-1.5">
      <div className="flex h-36 items-end gap-1.5 border-(--tone-blue)/40 border-b md:h-45 md:gap-2.5">
        {tests.map((test, i) => (
          <div
            key={test.id}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span
              className={cn(
                "font-semibold text-[11px] tabular-nums md:text-xs",
                i === last ? "text-lime-text" : "text-progress-text",
              )}
            >
              {format.number(test.score)}
            </span>
            <span
              className={cn(
                "w-full max-w-11 rounded-t-lg rounded-b-[3px]",
                i === last ? "bg-lime-strong" : "bg-(--tone-blue)",
              )}
              style={{ height: `${(test.score / test.max) * 80}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 md:gap-2.5">
        {tests.map((test) => (
          <span
            key={test.id}
            className="flex-1 text-center text-[10px] text-subtle md:text-[11px]"
          >
            {format.dateTime(test.finishedAt, {
              day: "numeric",
              month: "short",
            })}
          </span>
        ))}
      </div>
    </div>
  );
}

function TestRow({ test }: { test: TestSummary }) {
  const t = useTranslations("Stats");
  const variants = useTranslations("Variants");
  const format = useFormatter();
  const minutes = toMinutes(test.spentMs);

  return (
    <Link
      href={reviewHref(test.id)}
      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl bg-card px-3 py-2.5 outline-none hover:brightness-97 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-sm">
          {variants("testTitle", { kind: test.kind, title: test.title })}
        </span>
        <span className="text-subtle text-xs">
          {format.dateTime(test.finishedAt, { day: "numeric", month: "short" })}
          {minutes > 0 &&
            ` · ${t("duration", { hours: Math.floor(minutes / 60), minutes: minutes % 60 })}`}
        </span>
      </span>
      <span className="font-bold text-[15px] tabular-nums">
        {format.number(test.score)}
        <span className="font-normal text-subtle">/{test.max}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-4 text-subtle" />
    </Link>
  );
}

interface TestsCardProps {
  charted: TestSummary[];
  listed: TestSummary[];
}

export function TestsCard({ charted, listed }: TestsCardProps) {
  const t = useTranslations("Stats");
  const last = listed[0];

  return (
    <section
      aria-labelledby="stats-tests"
      className="grid gap-5 rounded-[20px] bg-(--tone-blue-tint) p-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-8 md:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="stats-tests" className="font-semibold text-[17px]">
            {t("tests")}
          </h2>
          {last && (
            <>
              <span className="text-muted-foreground text-sm">
                {t.rich("last", {
                  score: last.score,
                  max: last.max,
                  ...tags,
                })}
              </span>
              <Delta last={last} previous={listed[1]} />
            </>
          )}
        </div>
        {charted.length > 0 ? (
          <Chart tests={charted} />
        ) : (
          <EmptyNote
            text={t("testsEmpty")}
            href="/variants"
            action={t("toTests")}
          />
        )}
      </div>
      {listed.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="mb-1.5 font-medium text-[13px] text-subtle">
            {t("recent")}
          </h3>
          {listed.map((test) => (
            <TestRow key={test.id} test={test} />
          ))}
          <Link
            href="/variants?tab=history"
            className="mt-1.5 self-start rounded-sm text-[13px] text-muted-foreground underline underline-offset-3 hover:text-foreground"
          >
            {t("allTests")} ›
          </Link>
        </div>
      )}
    </section>
  );
}
