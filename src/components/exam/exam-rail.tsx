"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { ExamTask } from "@/content/variants";
import type { ExamRun } from "@/lib/exam-store";
import { answeredCount, isAnswered } from "@/lib/run";
import { ExamTimer } from "./exam-timer";
import { FinishDialog } from "./finish-dialog";

interface ExamRailProps {
  run: ExamRun;
  tasks: ExamTask[];
  minutes: number;
  pending: boolean;
  onGo: (index: number) => void;
  onFinish: () => void;
}

export function ExamRail({
  run,
  tasks,
  minutes,
  pending,
  onGo,
  onFinish,
}: ExamRailProps) {
  const t = useTranslations("Exam");
  const done = answeredCount(run);

  return (
    <Card size="sm" className="gap-4">
      <ExamTimer
        startedAt={run.startedAt}
        minutes={minutes}
        timed={run.timed}
      />
      <nav aria-label={t("tasks")} className="grid grid-cols-5 gap-2">
        {tasks.map((task, i) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onGo(i)}
            aria-current={i === run.current ? "step" : undefined}
            aria-label={t("task", { number: task.number })}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg bg-muted font-semibold text-sm text-subtle outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              isAnswered(run.answers[i] ?? []) && "bg-data-tint text-data",
              i === run.current && "bg-primary text-primary-foreground",
            )}
          >
            {task.number}
          </button>
        ))}
      </nav>
      <span className="px-1 text-sm text-subtle">
        {t("answered", { count: done, total: tasks.length })}
      </span>
      <FinishDialog
        left={tasks.length - done}
        pending={pending}
        onFinish={onFinish}
      />
    </Card>
  );
}
