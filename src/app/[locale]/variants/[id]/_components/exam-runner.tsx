"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import type { ExamTask as Task } from "@/content/variants";
import { useRouter } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";
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
  if (!run || !task) return <Card className="min-h-96" aria-busy />;

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
      if (saved.saved) router.push(`/review?run=${run.runId}`);
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
