import { cn } from "cn";
import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { segmentTone } from "@/components/segment-tone";
import { isRight } from "@/db/columns";
import { RevealSwitch } from "@/features/practice/reveal/reveal";
import type {
  Comparison,
  Comparisons,
  Review,
  ReviewAttempt,
  ReviewRow,
} from "@/features/tests/review";
import type { VariantTask } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { toMinutes } from "@/lib/dates";

interface ReviewRowsProps {
  review: Review<VariantTask>;
  comparisons: Comparisons;
  testSessionId: string;
}

export function ReviewRows({
  review,
  comparisons,
  testSessionId,
}: ReviewRowsProps) {
  const t = useTranslations("Review");

  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-semibold text-lg">{t("tasks")}</h2>
      <ul>
        {review.rows.map((row) => (
          <Row
            key={row.taskId}
            row={row}
            comparison={comparisons[row.taskId]}
            testSessionId={testSessionId}
          />
        ))}
      </ul>
    </section>
  );
}

interface RowProps {
  row: ReviewRow<VariantTask>;
  comparison?: Comparison;
  testSessionId: string;
}

function Row({ row, comparison, testSessionId }: RowProps) {
  const t = useTranslations("Review");
  const solve = useTranslations("Solve");
  const format = useFormatter();
  const minutes = toMinutes(row.attempt?.durationMs ?? 0);

  return (
    <li className="border-b">
      <details className="group/row">
        <summary className="flex cursor-pointer list-none items-center gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="w-5.5 shrink-0 font-semibold text-muted-foreground text-sm tabular-nums">
            {row.number}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.75">
            <MathHtml
              html={row.statement}
              className="overflow-hidden whitespace-nowrap text-[15px] leading-normal mask-r-from-85% md:text-base [&_.katex-display]:my-0 [&_.katex-display]:inline [&_p]:inline [&>:not(:first-child)]:hidden"
            />
            <span className="text-[13px] text-subtle">
              {row.topicName} ·{" "}
              {row.attempt ? t("minutes", { minutes }) : t("skipped")}
            </span>
          </span>
          <span
            className={cn(
              "w-10 shrink-0 text-right font-semibold text-[15px] tabular-nums",
              segmentTone[row.segment].text,
            )}
          >
            {format.number(row.earned)}/{row.points}
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-subtle transition-transform group-open/row:rotate-90" />
        </summary>
        <div className="flex flex-col items-start gap-3 pb-4 pl-9.5">
          {row.attempt && (
            <p className="text-[13px] text-subtle [&_.katex]:text-[1em]">
              <GivenAnswer attempt={row.attempt} comparison={comparison} />
            </p>
          )}
          <RevealSwitch
            taskId={row.taskId}
            testSessionId={testSessionId}
            parts={[
              { part: "answer", label: solve("answer") },
              { part: "solution", label: solve("solution") },
            ]}
          >
            <Link
              href={`/bank/${row.taskId}`}
              className="ml-auto inline-flex items-center gap-1 rounded-sm font-semibold text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {t("toTask")}
              <ArrowRightIcon className="size-4" />
            </Link>
          </RevealSwitch>
        </div>
      </details>
    </li>
  );
}

function GivenAnswer({
  attempt,
  comparison,
}: {
  attempt: ReviewAttempt;
  comparison?: Comparison;
}) {
  const t = useTranslations("Review");

  const unreadable = attempt.outcomes.filter((o) => o === "unreadable").length;

  if (!comparison) {
    const right = t("partsRight", {
      right: attempt.outcomes.filter(isRight).length,
      total: attempt.outcomes.length,
    });
    return unreadable > 0
      ? `${right} · ${t("unreadable", { count: unreadable })}`
      : right;
  }
  return (
    <>
      {unreadable > 0 ? (
        t("unreadableOne")
      ) : (
        <>
          {t("gave")} <MathHtml as="span" html={comparison.given} />
        </>
      )}
      , {t("key")} <MathHtml as="span" html={comparison.key} />
    </>
  );
}
