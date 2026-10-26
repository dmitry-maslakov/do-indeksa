"use client";

import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { LocalTest } from "./exam-store";
import { TimeUp, useClock } from "./exam-timer";
import { FinishDialog } from "./finish-dialog";
import { answeredCount, isAnswered } from "./test-state";
import type { ExamTask } from "./variants";

interface ExamBarProps {
  test: LocalTest;
  tasks: ExamTask[];
  pending: boolean;
  onGo: (index: number) => void;
  onFinish: () => void;
}

export function ExamBar({
  test,
  tasks,
  pending,
  onGo,
  onFinish,
}: ExamBarProps) {
  const t = useTranslations("Exam");
  const solve = useTranslations("Solve");
  const { over, text } = useClock(test);

  return (
    <div className="md:hidden">
      <div className="-mx-2 flex h-14 items-center gap-2">
        <Link
          href="/variants"
          aria-label={solve("back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <span className="min-w-0 flex-1 truncate font-semibold">
          {test.title}
        </span>
        <span
          role="timer"
          className={cn(
            "font-semibold tabular-nums",
            over && "text-overtime-text",
          )}
        >
          {text}
        </span>
        <FinishDialog
          left={tasks.length - answeredCount(test)}
          pending={pending}
          onFinish={onFinish}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 h-8.5 rounded-full px-3"
            />
          }
        >
          {t("finishShort")}
        </FinishDialog>
      </div>
      <nav aria-label={t("tasks")} className="flex gap-1 pt-1">
        {tasks.map((task, i) => {
          const answered = isAnswered(test.answers[i] ?? []);
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onGo(i)}
              aria-current={i === test.current ? "step" : undefined}
              aria-label={t("task", { number: task.number })}
              className={cn(
                "flex h-10 w-8 flex-col items-center justify-center gap-0.75 rounded-[10px] bg-muted text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current]:bg-card aria-[current]:font-bold aria-[current]:text-foreground aria-[current]:ring-[1.5px] aria-[current]:ring-foreground aria-[current]:ring-inset",
                answered ? "font-semibold" : "text-subtle",
              )}
            >
              {task.number}
              <span
                className={cn("size-1 rounded-full", answered && "bg-current")}
              />
            </button>
          );
        })}
      </nav>
      {over && <TimeUp className="pt-3" />}
    </div>
  );
}
