import { cn } from "cn";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import type { ExamTask } from "@/content/variants";
import { latexToHtml } from "@/lib/latex";
import type { Review, ReviewAttempt, ReviewRow } from "@/lib/review";

type Attempt = ReviewAttempt & { answers: string[] };

interface ReviewRowsProps {
  review: Review<Attempt>;
  tasks: ExamTask[];
  keys: Record<string, string[]>;
}

const columns =
  "grid grid-cols-[28px_minmax(0,1fr)_48px] gap-3.5 px-5 md:grid-cols-[44px_minmax(0,1fr)_70px_90px] md:px-6";

export function ReviewRows({ review, tasks, keys }: ReviewRowsProps) {
  const t = useTranslations("Review");
  const missed = review.rows.filter((r) => r.earned < r.points);
  const rest = review.rows.length - missed.length;

  return (
    <Card className="gap-0 p-0 py-2 md:p-0 md:py-2">
      <div className={cn(columns, "py-2.5 text-subtle text-xs")}>
        <span>№</span>
        <span>{t("task")}</span>
        <span>{t("points")}</span>
        <span className="hidden md:block">{t("time")}</span>
      </div>
      <ul className="divide-y divide-subtle/15 border-subtle/15 border-t">
        {missed.map((row) => {
          const task = tasks.find((x) => x.id === row.taskId);
          return (
            task && (
              <Row
                key={row.taskId}
                row={row}
                task={task}
                answerKey={keys[row.taskId] ?? []}
              />
            )
          );
        })}
      </ul>
      {rest > 0 && (
        <p className="px-5 pt-3.5 pb-2 text-[13px] text-subtle md:px-6">
          {t("rest", { count: rest })}
        </p>
      )}
    </Card>
  );
}

interface RowProps {
  row: ReviewRow<Attempt>;
  task: ExamTask;
  answerKey: string[];
}

function Row({ row, task, answerKey }: RowProps) {
  const t = useTranslations("Review");
  const solve = useTranslations("Solve");
  const minutes = Math.round((row.attempt?.durationMs ?? 0) / 60_000);

  return (
    <li>
      <details className="group/row">
        <summary
          className={cn(
            columns,
            "cursor-pointer list-none items-center py-3.5 text-sm hover:bg-muted/50 [&::-webkit-details-marker]:hidden",
          )}
        >
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg font-semibold text-[13px]",
              row.attempt
                ? "border-2 border-error text-error-text"
                : "bg-untouched text-subtle",
            )}
          >
            {row.number}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <MathHtml
              html={task.statement}
              className="truncate [&_.katex-display]:my-0 [&_.katex-display]:inline [&_p]:inline [&>:not(:first-child)]:hidden"
            />
            <span className="text-subtle text-xs [&_.katex]:text-[1em]">
              {task.topicName} ·{" "}
              {row.attempt ? (
                <Outcome attempt={row.attempt} answerKey={answerKey} />
              ) : (
                t("skipped")
              )}
            </span>
          </span>
          <span
            className={cn(
              "font-semibold",
              row.attempt ? "text-error-text" : "text-subtle",
            )}
          >
            {row.earned} / {row.points}
          </span>
          <span
            className={cn(
              "hidden md:block",
              row.over ? "font-semibold text-overtime-text" : "text-subtle",
            )}
          >
            {row.attempt ? t("minutes", { minutes }) : "—"}
          </span>
        </summary>
        <div className="flex flex-col gap-2 px-5 pb-4 md:px-6">
          <Reveal label={solve("answer")} taskId={task.id} part="answer" />
          <Reveal label={solve("solution")} taskId={task.id} part="solution" />
        </div>
      </details>
    </li>
  );
}

function Outcome({
  attempt,
  answerKey,
}: {
  attempt: Attempt;
  answerKey: string[];
}) {
  const t = useTranslations("Review");
  const [key] = answerKey;

  if (answerKey.length !== 1 || key === undefined) {
    return t("partsRight", {
      right: attempt.parts.filter(Boolean).length,
      total: attempt.parts.length,
    });
  }
  return (
    <>
      {t("gave")}{" "}
      <MathHtml as="span" html={latexToHtml(attempt.answers[0] ?? "")} />,{" "}
      {t("key")} <MathHtml as="span" html={latexToHtml(key)} />
    </>
  );
}
