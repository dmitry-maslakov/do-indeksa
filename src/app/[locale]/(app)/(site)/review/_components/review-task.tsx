"use client";

import { cn } from "cn";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";
import { MathHtml } from "@/components/math-html";
import { segmentTone } from "@/components/segment-tone";
import { Button } from "@/components/ui/button";
import type { PartOutcome } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import { ReportTask } from "@/features/practice/report-task";
import { RevealSwitch } from "@/features/practice/reveal/reveal";
import type { PartAnswer, Shown } from "@/features/tests/review";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import type { ReviewEntry } from "./review-entry";

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

function Statement({ html }: { html: string }) {
  const t = useTranslations("Review");
  const box = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (el) setLong(el.scrollHeight > el.clientHeight + 1);
  }, []);

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        ref={box}
        className={cn(
          "w-full overflow-hidden",
          !open && "max-h-[8em]",
          !open && long && "mask-b-from-60%",
        )}
      >
        <MathHtml
          html={html}
          className="overflow-x-auto text-base leading-relaxed md:text-[17px] [&_strong]:font-semibold"
        />
      </div>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-sm text-muted-foreground text-sm underline underline-offset-3 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? t("showLess") : t("showAll")}
        </button>
      )}
    </div>
  );
}

function Value({ shown, part }: { shown: Shown; part?: PartLabel }) {
  const field = useTranslations("Field");
  const prefix = part ? part.prefix : null;
  const suffix = part ? part.suffix : null;
  if ("yesno" in shown) return field(shown.yesno);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      {prefix && (
        <MathHtml
          as="span"
          html={prefix}
          className="text-muted-foreground [&_p]:inline"
        />
      )}
      <MathHtml as="span" html={shown.html} />
      {suffix && (
        <MathHtml
          as="span"
          html={suffix}
          className="text-muted-foreground [&_p]:inline"
        />
      )}
    </span>
  );
}

const givenTone: Partial<Record<PartOutcome, string>> = {
  right: "bg-success-tint",
  wrong: "bg-error-tint",
  unreadable: "bg-overtime-tint",
};

function Given({
  answer,
  outcome,
  part,
}: {
  answer: PartAnswer;
  outcome?: PartOutcome;
  part?: PartLabel;
}) {
  const t = useTranslations("Review");
  if (outcome === "unreadable")
    return <span className="text-overtime-text">{t("unread")}</span>;
  if (!answer.given || !outcome || outcome === "empty")
    return <span className="text-subtle">{t("skipped")}</span>;
  return (
    <span className="flex items-center gap-2">
      {outcome === "right" ? (
        <CheckIcon aria-hidden className="size-4 shrink-0 text-success-text" />
      ) : (
        <XIcon aria-hidden className="size-4 shrink-0 text-error-text" />
      )}
      <span className="sr-only">
        {t("status", { segment: outcome === "right" ? "done" : "error" })}
      </span>
      <Value shown={answer.given} part={part} />
    </span>
  );
}

function Answers({ entry }: { entry: ReviewEntry }) {
  const t = useTranslations("Review");
  const lettered = entry.answers.length > 1;
  const letters = entry.parts.map((part) => part.letter);
  const cell = "px-3.5 py-2.5 text-left align-middle";

  return (
    <div className="overflow-x-auto rounded-[14px] border">
      <table className="w-full border-collapse text-sm [&_.katex]:text-[1.05em]">
        <caption className="sr-only">{t("answers")}</caption>
        <thead className="bg-muted text-subtle text-xs">
          <tr>
            {lettered && <th className={cn(cell, "w-11 py-2")} />}
            <th scope="col" className={cn(cell, "py-2 font-normal")}>
              {t("given")}
            </th>
            <th scope="col" className={cn(cell, "py-2 font-normal")}>
              {t("correct")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entry.answers.map((answer, i) => {
            const part = entry.parts[i];
            const outcome = entry.outcomes[i];
            const repeated = i > 0 && letters[i] === letters[i - 1];
            return (
              <tr
                key={`${part?.letter}${part?.prefix}${part?.caption}`}
                className={cn("border-t", repeated && "border-t-border/40")}
              >
                {lettered && (
                  <th scope="row" className={cn(cell, "font-semibold")}>
                    {!repeated && letters[i]}
                  </th>
                )}
                <td className={cn(cell, outcome && givenTone[outcome])}>
                  <Given answer={answer} outcome={outcome} part={part} />
                </td>
                <td className={cell}>
                  <Value shown={answer.key} part={part} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface ReviewTaskProps {
  entry: ReviewEntry;
  timed: boolean;
  testSessionId: string;
  prev?: number;
  next?: number;
  onPrev: () => void;
  onNext: () => void;
}

export function ReviewTask({
  entry,
  timed,
  testSessionId,
  prev,
  next,
  onPrev,
  onNext,
}: ReviewTaskProps) {
  const t = useTranslations("Review");
  const solve = useTranslations("Solve");
  const step = "size-8 rounded-[10px]";

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
        <span className="hidden gap-1 lg:flex">
          <Button
            variant="ghost"
            size="icon-sm"
            className={step}
            aria-label={t("prev")}
            disabled={prev === undefined}
            onClick={onPrev}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={step}
            aria-label={t("next")}
            disabled={next === undefined}
            onClick={onNext}
          >
            <ChevronRightIcon />
          </Button>
        </span>
      </div>
      <Statement html={entry.statement} />
      <Answers entry={entry} />
      <RevealSwitch
        taskId={entry.taskId}
        testSessionId={testSessionId}
        parts={[{ part: "solution", label: solve("solution") }]}
      >
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
      </RevealSwitch>
      <ReportTask taskId={entry.taskId} />
      <div className="mt-auto grid grid-cols-2 gap-2 lg:hidden">
        <Button
          variant="ghost"
          className="h-11 rounded-xl"
          disabled={prev === undefined}
          onClick={onPrev}
        >
          <ChevronLeftIcon />
          {prev ?? ""}
          <span className="sr-only">{t("prev")}</span>
        </Button>
        <Button
          variant="ghost"
          className="h-11 rounded-xl"
          disabled={next === undefined}
          onClick={onNext}
        >
          <span className="sr-only">{t("next")}</span>
          {next ?? ""}
          <ChevronRightIcon />
        </Button>
      </div>
    </article>
  );
}
