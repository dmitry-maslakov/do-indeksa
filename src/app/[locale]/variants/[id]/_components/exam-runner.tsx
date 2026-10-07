"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AnswerField } from "@/components/answer-field";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExamTask } from "@/content/variants";
import { useExamStore } from "./exam-store";
import { ExamTimer } from "./exam-timer";

interface ExamRunnerProps {
  variantId: string;
  tasks: ExamTask[];
  minutes: number;
}

function useHydrated() {
  useEffect(() => {
    useExamStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    (onChange) => useExamStore.persist.onFinishHydration(onChange),
    () => useExamStore.persist.hasHydrated(),
    () => false,
  );
}

export function ExamRunner({ variantId, tasks, minutes }: ExamRunnerProps) {
  const t = useTranslations("Exam");
  const solve = useTranslations("Solve");
  const hydrated = useHydrated();
  const run = useExamStore((s) => s.runs[variantId]);
  const { start, answer, go } = useExamStore.getState();

  useEffect(() => {
    if (hydrated)
      start(
        variantId,
        tasks.map((task) => task.labels.length),
      );
  }, [hydrated, start, variantId, tasks]);

  const current = run?.current ?? 0;
  const task = tasks[current];
  const edits = useMemo(
    () =>
      task?.labels.map(
        (_, i) => (value: string) => answer(variantId, i, value),
      ),
    [task, answer, variantId],
  );

  if (!run || !task) return <Card className="min-h-96" aria-busy />;

  const done = run.answers.filter((parts) => parts.some(Boolean)).length;

  return (
    <div className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <Card size="sm" className="gap-4">
        <ExamTimer startedAt={run.startedAt} minutes={minutes} />
        <nav aria-label={t("tasks")} className="grid grid-cols-5 gap-2">
          {tasks.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(variantId, i)}
              aria-current={i === current ? "step" : undefined}
              aria-label={t("task", { number: item.number })}
              className={cn(
                "flex h-10 items-center justify-center rounded-lg bg-muted font-semibold text-sm text-subtle outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                run.answers[i]?.some(Boolean) && "bg-data-tint text-data",
                i === current && "bg-primary text-primary-foreground",
              )}
            >
              {item.number}
            </button>
          ))}
        </nav>
        <span className="px-1 text-sm text-subtle">
          {t("answered", { count: done, total: tasks.length })}
        </span>
      </Card>
      <Card className="gap-6 md:p-9">
        <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
          <Badge variant="tint">{task.topic}</Badge>
          <span>{t("meta", { number: task.number, points: task.points })}</span>
        </div>
        <MathHtml
          html={task.statement}
          className="font-semibold text-lg tracking-tight md:text-task-lg"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {task.labels.map((labelHtml, i) => (
            <AnswerField
              key={`${task.id}-${labelHtml ?? i}`}
              name="answer"
              label={
                task.labels.length === 1
                  ? solve("yourAnswer")
                  : solve("answerPart", { number: i + 1 })
              }
              labelHtml={labelHtml}
              state="empty"
              defaultValue={run.answers[current]?.[i]}
              onEdit={edits?.[i] ?? noop}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            disabled={current === 0}
            onClick={() => go(variantId, current - 1)}
          >
            {t("prev")}
          </Button>
          {current < tasks.length - 1 && (
            <Button onClick={() => go(variantId, current + 1)}>
              {t("next")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

const noop = () => {};
