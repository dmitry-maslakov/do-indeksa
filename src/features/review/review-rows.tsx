import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Button } from "@/components/ui/button";
import type { ExamTask } from "@/features/exam/variants";
import { Reveal } from "@/features/tasks/reveal";
import { Link } from "@/i18n/navigation";
import { isRight } from "@/lib/part-outcome";
import type { Segment } from "@/lib/strip";
import type {
  AnswerOutcome,
  Outcomes,
  Review,
  ReviewAttempt,
  ReviewRow,
} from "./review";

interface ReviewRowsProps {
  review: Review;
  tasks: ExamTask[];
  outcomes: Outcomes;
  testSessionId: string;
}

const tones: Record<Segment, string> = {
  done: "text-success-text",
  partial: "text-overtime-text",
  error: "text-error-text",
  none: "text-subtle",
  current: "text-subtle",
};

export function ReviewRows({
  review,
  tasks,
  outcomes,
  testSessionId,
}: ReviewRowsProps) {
  const t = useTranslations("Review");

  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-semibold text-lg">{t("tasks")}</h2>
      <ul>
        {review.rows.map((row) => {
          const task = tasks.find((x) => x.id === row.taskId);
          return (
            task && (
              <Row
                key={row.taskId}
                row={row}
                task={task}
                outcome={outcomes[row.taskId]}
                testSessionId={testSessionId}
              />
            )
          );
        })}
      </ul>
    </section>
  );
}

interface RowProps {
  row: ReviewRow;
  task: ExamTask;
  outcome?: AnswerOutcome;
  testSessionId: string;
}

function Row({ row, task, outcome, testSessionId }: RowProps) {
  const t = useTranslations("Review");
  const solve = useTranslations("Solve");
  const minutes = Math.round((row.attempt?.durationMs ?? 0) / 60_000);

  return (
    <li className="border-b">
      <details className="group/row">
        <summary className="flex cursor-pointer list-none items-center gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="w-5.5 shrink-0 font-semibold text-muted-foreground text-sm tabular-nums">
            {row.number}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.75">
            <MathHtml
              html={task.statement}
              className="overflow-hidden whitespace-nowrap text-[15px] leading-normal mask-r-from-85% md:text-base [&_.katex-display]:my-0 [&_.katex-display]:inline [&_p]:inline [&>:not(:first-child)]:hidden"
            />
            <span className="text-[13px] text-subtle">
              {task.topicName} ·{" "}
              {row.attempt ? t("minutes", { minutes }) : t("skipped")}
            </span>
          </span>
          <span
            className={cn(
              "w-10 shrink-0 text-right font-semibold text-[15px] tabular-nums",
              tones[row.segment],
            )}
          >
            {row.earned}/{row.points}
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-subtle transition-transform group-open/row:rotate-90" />
        </summary>
        <div className="flex flex-col items-start gap-2 pb-4 pl-9.5">
          {row.attempt && (
            <p className="text-[13px] text-subtle [&_.katex]:text-[1em]">
              <Outcome attempt={row.attempt} outcome={outcome} />
            </p>
          )}
          <Reveal
            label={solve("answer")}
            taskId={task.id}
            testSessionId={testSessionId}
            part="answer"
          />
          <Reveal
            label={solve("solution")}
            taskId={task.id}
            testSessionId={testSessionId}
            part="solution"
          />
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/bank/${task.id}`} />}
            nativeButton={false}
          >
            {t("toTask")}
          </Button>
        </div>
      </details>
    </li>
  );
}

function Outcome({
  attempt,
  outcome,
}: {
  attempt: ReviewAttempt;
  outcome?: AnswerOutcome;
}) {
  const t = useTranslations("Review");

  const unreadable = attempt.outcomes.filter((o) => o === "unreadable").length;

  if (!outcome) {
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
          {t("gave")} <MathHtml as="span" html={outcome.given} />
        </>
      )}
      , {t("key")} <MathHtml as="span" html={outcome.key} />
    </>
  );
}
