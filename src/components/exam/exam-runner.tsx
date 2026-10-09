"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExamTask as Task } from "@/content/variants";
import { useRouter } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";
import { reviewHref } from "@/lib/review-href";
import { finishRun, type RunResult } from "@/server/runs";
import { ExamIntro } from "./exam-intro";
import { ExamRail } from "./exam-rail";
import { ExamResult } from "./exam-result";
import { ExamTask } from "./exam-task";

interface ExamRunnerProps {
  variantId: string;
  tasks: Task[];
  minutes: number;
  title: string;
  swaps?: (string | undefined)[];
}

export function ExamRunner({
  variantId,
  tasks,
  minutes,
  title,
  swaps,
}: ExamRunnerProps) {
  const hydrated = useExamHydrated();
  const router = useRouter();
  const run = useExamStore((s) => s.runs[variantId]);
  const { start, answer, go, clear } = useExamStore.getState();
  const [result, setResult] = useState<RunResult>();
  const [pending, startTransition] = useTransition();
  const meta = useMemo(
    () => ({
      title,
      minutes,
      tasks: tasks.map((task) => ({
        number: task.number,
        topic: task.topicName,
        parts: task.labels.length,
      })),
    }),
    [title, minutes, tasks],
  );
  const onAnswer = useCallback(
    (part: number, value: string) => answer(variantId, part, value),
    [answer, variantId],
  );

  if (result) {
    return (
      <ExamResult
        tasks={tasks}
        result={result}
        onRetry={() => setResult(undefined)}
      />
    );
  }

  if (hydrated && !run) {
    return (
      <ExamIntro
        title={title}
        tasks={tasks}
        minutes={minutes}
        swaps={swaps}
        onStart={(timed) => start(variantId, { ...meta, timed })}
      />
    );
  }

  const task = run && tasks[run.current];
  if (!run || !task) {
    return (
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <Card size="sm" className="gap-4 max-md:order-1">
          <Skeleton className="my-1.5 h-3 w-32" />
          <Skeleton className="h-11 rounded-lg" />
        </Card>
        <Card className="gap-3 md:p-9">
          {[100, 90, 60].map((width) => (
            <Skeleton
              key={width}
              className="h-4"
              style={{ width: `${width}%` }}
            />
          ))}
        </Card>
      </div>
    );
  }

  const finish = () =>
    startTransition(async () => {
      const spent = Date.now() - run.enteredAt;
      const saved = await finishRun({
        runId: run.runId,
        variantId,
        startedAt: run.startedAt,
        answers: run.answers,
        durations: run.spent.map((ms, i) =>
          i === run.current ? ms + spent : ms,
        ),
      });
      clear(variantId);
      if (saved.saved) router.push(reviewHref(run.runId));
      else setResult(saved);
    });

  return (
    <div className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <ExamRail
        run={run}
        tasks={tasks}
        minutes={minutes}
        pending={pending}
        onGo={(i) => go(variantId, i)}
        onFinish={finish}
      />
      <ExamTask
        task={task}
        answers={run.answers[run.current] ?? []}
        first={run.current === 0}
        last={run.current === tasks.length - 1}
        onAnswer={onAnswer}
        onPrev={() => go(variantId, run.current - 1)}
        onNext={() => go(variantId, run.current + 1)}
      />
    </div>
  );
}
