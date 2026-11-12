"use client";

import { cn } from "cn";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { segmentTone } from "@/components/segment-tone";
import { Button } from "@/components/ui/button";
import { ReportTask } from "@/features/practice/report-task";
import { RevealSolution } from "@/features/practice/reveal/reveal";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { Answers } from "./review-answers";
import { ChoiceAnswers } from "./review-choice";
import type { ReviewEntry } from "./review-entry";
import { Statement } from "./review-statement";

export function TaskBadge({
  entry,
  className,
}: {
  entry: ReviewEntry;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full font-bold text-xs tabular-nums",
        segmentTone[entry.segment].chip,
        className,
      )}
    >
      {entry.number}
    </span>
  );
}

interface ReviewTaskProps {
  entry: ReviewEntry;
  timed: boolean;
  testSessionId: string;
  prev?: number;
  next?: number;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function ReviewTask({
  entry,
  timed,
  testSessionId,
  prev,
  next,
  position,
  total,
  onPrev,
  onNext,
}: ReviewTaskProps) {
  const t = useTranslations("Review");
  const solve = useTranslations("Solve");

  return (
    <article
      aria-label={t("task", { number: entry.number })}
      className="flex min-w-0 flex-col gap-4 rounded-[20px] border p-4 md:p-6"
    >
      <div className="flex items-center gap-2.5">
        <TaskBadge entry={entry} className="size-7 text-[13px]" />
        <h2 className="min-w-0 truncate font-semibold text-[17px]">
          {entry.topicName}
        </h2>
        <span className="ml-auto shrink-0 text-muted-foreground text-sm tabular-nums">
          {timed && entry.ms > 0 && (
            <>
              {t("minutes", { minutes: entry.minutesSpent })}
              {" · "}
            </>
          )}
          <span className="font-semibold text-foreground">
            {t("earned", {
              earned: entry.earned,
              points: entry.points,
            })}
          </span>
        </span>
      </div>
      <div className="grid gap-4 2xl:grid-cols-2 2xl:grid-rows-[auto_auto_1fr] 2xl:gap-x-7">
        <Statement html={entry.statement} />
        {entry.choice ? (
          <ChoiceAnswers entry={entry} choice={entry.choice} />
        ) : (
          <Answers entry={entry} />
        )}
        <RevealSolution
          taskId={entry.taskId}
          testSessionId={testSessionId}
          label={solve("solution")}
          className="2xl:col-start-2 2xl:row-span-3 2xl:row-start-1 2xl:self-start 2xl:rounded-2xl 2xl:bg-muted 2xl:p-5"
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 self-start">
          <Link
            href={`/bank/${entry.taskId}`}
            target="_blank"
            rel="noopener"
            data-intent={intentOf({ via: "review", placement: "review_row" })}
            className="inline-flex items-center gap-1 rounded-sm font-semibold text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {t("toBank")}
            <ArrowUpRightIcon aria-hidden className="size-4" />
          </Link>
          <Link
            href={`/bank/similar/${entry.taskId}`}
            prefetch={false}
            target="_blank"
            rel="noopener"
            data-intent={intentOf({
              via: "review",
              placement: "review_similar",
            })}
            className="inline-flex items-center gap-1 rounded-sm font-semibold text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {t("similar")}
            <ArrowUpRightIcon aria-hidden className="size-4" />
          </Link>
          <ReportTask taskId={entry.taskId} />
        </div>
      </div>
      <nav
        aria-label={t("tasks")}
        className="mt-auto flex items-center justify-center gap-5 pt-1"
      >
        <Button
          variant="lime"
          size="icon"
          className="rounded-full"
          aria-label={t("prev")}
          disabled={prev === undefined}
          onClick={onPrev}
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <span className="min-w-12 text-center text-muted-foreground text-sm tabular-nums">
          {position} / {total}
        </span>
        <Button
          variant="lime"
          size="icon"
          className="rounded-full"
          aria-label={t("next")}
          disabled={next === undefined}
          onClick={onNext}
        >
          <ChevronRightIcon className="size-5" />
        </Button>
      </nav>
    </article>
  );
}
