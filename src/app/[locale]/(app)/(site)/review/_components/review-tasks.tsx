"use client";

import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { segmentTone } from "@/components/segment-tone";
import { controlOf } from "@/lib/analytics-browser";
import type { ReviewEntry } from "./review-entry";
import { ReviewTask, TaskBadge } from "./review-task";

interface ReviewTasksProps {
  tasks: ReviewEntry[];
  timed: boolean;
  testSessionId: string;
}

const firstToReview = (tasks: ReviewEntry[]) =>
  Math.max(
    0,
    tasks.findIndex((task) => task.segment !== "done"),
  );

const toneOf = (ms: number, longest: number) => {
  if (ms === 0 || longest === 0) return "text-subtle";
  const share = ms / longest;
  if (share < 0.25) return "bg-foreground/5";
  if (share < 0.5) return "bg-foreground/10";
  if (share < 0.75) return "bg-foreground/15";
  return "bg-foreground/25";
};

export function ReviewTasks({ tasks, timed, testSessionId }: ReviewTasksProps) {
  const t = useTranslations("Review");
  const format = useFormatter();
  const [index, setIndex] = useState(() => firstToReview(tasks));
  const task = tasks[index];
  const longest = Math.max(0, ...tasks.map((x) => x.ms));
  if (!task) return null;

  const score = (x: ReviewEntry) =>
    x.segment === "none" && x.earned === 0
      ? "—"
      : `${format.number(x.earned)}/${x.points}`;

  return (
    <section
      aria-label={t("tasks")}
      className="grid gap-4 lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:items-stretch lg:gap-6"
    >
      <ol className="hidden flex-col gap-0.5 rounded-[20px] bg-muted p-2 lg:flex">
        {tasks.map((x, i) => (
          <li key={x.taskId}>
            <button
              type="button"
              aria-current={i === index || undefined}
              data-control={
                i === index
                  ? undefined
                  : controlOf({
                      control: "review_row",
                      value: String(x.number),
                    })
              }
              onClick={() => setIndex(i)}
              className={cn(
                "grid h-10.5 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm outline-none hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring aria-[current]:bg-card aria-[current]:shadow-raised",
                timed
                  ? "grid-cols-[1.5rem_minmax(0,1fr)_auto_2.5rem]"
                  : "grid-cols-[1.5rem_minmax(0,1fr)_2.5rem]",
              )}
            >
              <TaskBadge entry={x} />
              <span className="truncate font-medium in-aria-[current]:font-semibold">
                {x.topicName}
                <span className="sr-only">
                  {" · "}
                  {t("status", { segment: x.segment })}
                </span>
              </span>
              {timed && (
                <span
                  className={cn(
                    "rounded-md px-1.5 text-xs tabular-nums",
                    toneOf(x.ms, longest),
                  )}
                >
                  {x.ms > 0 ? t("minutes", { minutes: x.minutesSpent }) : "—"}
                </span>
              )}
              <span className="text-right font-semibold tabular-nums">
                {score(x)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <ol className="grid auto-cols-fr grid-flow-col gap-1 lg:hidden">
        {tasks.map((x, i) => (
          <li key={x.taskId}>
            <button
              type="button"
              aria-current={i === index || undefined}
              aria-label={`${t("task", { number: x.number })} · ${t("status", { segment: x.segment })}`}
              data-control={
                i === index
                  ? undefined
                  : controlOf({
                      control: "review_row",
                      value: String(x.number),
                    })
              }
              onClick={() => setIndex(i)}
              className={cn(
                "flex w-full flex-col items-center rounded-[10px] py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current]:outline-2 aria-[current]:outline-foreground aria-[current]:outline-offset-2",
                segmentTone[x.segment].chip,
              )}
            >
              <span className="font-bold text-sm leading-4.5 tabular-nums">
                {x.number}
              </span>
              <span className="text-[10px] leading-3 tabular-nums">
                {score(x)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <ReviewTask
        key={task.taskId}
        entry={task}
        timed={timed}
        testSessionId={testSessionId}
        prev={tasks[index - 1]?.number}
        next={tasks[index + 1]?.number}
        onPrev={() => setIndex(index - 1)}
        onNext={() => setIndex(index + 1)}
      />
    </section>
  );
}
