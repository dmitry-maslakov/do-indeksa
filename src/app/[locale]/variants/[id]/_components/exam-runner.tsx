"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AnswerField } from "@/components/answer-field";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExamTask } from "@/content/variants";
import { useRouter } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";
import { finishRun, type RunResult } from "@/server/runs";
import { ExamResult } from "./exam-result";
import { ExamTimer } from "./exam-timer";
import { FinishDialog } from "./finish-dialog";

interface ExamRunnerProps {
  variantId: string;
  tasks: ExamTask[];
  minutes: number;
  timed: boolean;
}

export function ExamRunner({
  variantId,
  tasks,
  minutes,
  timed,
}: ExamRunnerProps) {
  const t = useTranslations("Exam");
  const solve = useTranslations("Solve");
  const hydrated = useExamHydrated();
  const router = useRouter();
  const run = useExamStore((s) => s.runs[variantId]);
  const { start, answer, go, clear } = useExamStore.getState();
  const [result, setResult] = useState<RunResult>();
  const [pending, startTransition] = useTransition();
  const parts = useMemo(() => tasks.map((task) => task.labels.length), [tasks]);

  useEffect(() => {
    if (hydrated) start(variantId, parts, timed);
  }, [hydrated, start, variantId, parts, timed]);

  const current = run?.current ?? 0;
  const task = tasks[current];
  const edits = useMemo(
    () =>
      task?.labels.map(
        (_, i) => (value: string) => answer(variantId, i, value),
      ),
    [task, answer, variantId],
  );

  if (result) {
    return (
      <ExamResult
        tasks={tasks}
        result={result}
        onRetry={() => {
          setResult(undefined);
          start(variantId, parts, timed);
        }}
      />
    );
  }

  if (!run || !task) return <Card className="min-h-96" aria-busy />;

  const done = run.answers.filter((a) => a.some(Boolean)).length;

  const finish = () =>
    startTransition(async () => {
      const spent = Date.now() - run.enteredAt;
      const saved = await finishRun({
        runId: run.runId,
        variantId,
        startedAt: run.startedAt,
        answers: run.answers,
        durations: run.spent.map((ms, i) => (i === current ? ms + spent : ms)),
      });
      clear(variantId);
      if (saved.saved) router.push(`/review?run=${run.runId}`);
      else setResult(saved);
    });

  return (
    <div className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <Card size="sm" className="gap-4">
        <ExamTimer
          startedAt={run.startedAt}
          minutes={minutes}
          timed={run.timed !== false}
        />
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
        <FinishDialog
          left={tasks.length - done}
          pending={pending}
          onFinish={finish}
        />
      </Card>
      <Card className="gap-6 md:p-9">
        <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
          <Badge variant="tint">{task.topicName}</Badge>
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
