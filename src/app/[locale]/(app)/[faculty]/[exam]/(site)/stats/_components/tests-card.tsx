import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { practiceWeeks } from "@/features/progress/practice-days";
import { reviewHref } from "@/features/tests/review";
import type { TestSummary } from "@/features/tests/summaries";
import { Link } from "@/i18n/navigation";
import { minuteMs } from "@/lib/dates";
import { useDuration } from "@/lib/use-duration";

function TestRow({ test, latest }: { test: TestSummary; latest: boolean }) {
  const variants = useTranslations("Variants");
  const format = useFormatter();
  const duration = useDuration();

  return (
    <Link
      href={reviewHref(test.id)}
      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 rounded-xl bg-(--tone-blue-tint) px-3 py-2.5 outline-none hover:brightness-97 focus-visible:ring-2 focus-visible:ring-ring md:bg-card md:grid-cols-[12rem_minmax(0,1fr)_auto_auto] md:gap-x-4 md:px-4"
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-sm">
          {variants("testTitle", { kind: test.kind, title: test.title })}
        </span>
        <span className="text-subtle text-xs">
          {format.dateTime(test.finishedAt, { day: "numeric", month: "short" })}
          {test.spentMs >= minuteMs && ` · ${duration(test.spentMs)}`}
        </span>
      </span>
      <span
        aria-hidden
        className="col-span-full row-start-2 h-2 overflow-hidden rounded-full bg-card md:col-span-1 md:bg-(--tone-blue-tint) md:col-start-2 md:row-start-1 md:h-2.5"
      >
        <span
          className={cn(
            "block h-full rounded-full",
            latest ? "bg-lime-strong" : "bg-(--tone-blue)",
          )}
          style={{ width: `${(test.score / test.max) * 100}%` }}
        />
      </span>
      <span className="text-right font-bold text-[15px] tabular-nums">
        {format.number(test.score)}
        <span className="font-normal text-subtle">/{test.max}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-4 text-subtle" />
    </Link>
  );
}

export function TestsCard({ tests }: { tests: TestSummary[] }) {
  const t = useTranslations("Stats");

  return (
    <section
      aria-labelledby="stats-tests"
      className="flex flex-col gap-3 md:rounded-[20px] md:bg-(--tone-blue-tint) md:p-6"
    >
      <div className="flex items-baseline gap-2.5">
        <h2 id="stats-tests" className="font-semibold text-[17px]">
          {t("tests")}
        </h2>
        <span className="text-[13px] text-subtle">
          {t("period", { weeks: practiceWeeks })}
        </span>
      </div>
      {tests.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {tests.map((test, i) => (
              <TestRow key={test.id} test={test} latest={i === 0} />
            ))}
          </div>
          <Link
            href="/variants?tab=history"
            className="self-start rounded-sm text-[13px] text-muted-foreground underline underline-offset-3 hover:text-foreground"
          >
            {t("allTests")} ›
          </Link>
        </>
      ) : (
        <EmptyNote
          text={t("testsEmpty")}
          href="/variants"
          action={t("toTests")}
        />
      )}
    </section>
  );
}
