"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExamTask as Task } from "@/content/variants";
import { useRouter } from "@/i18n/navigation";
import type { ComposeMode } from "@/lib/compose";
import { spentAt, useExamHydrated, useExamStore } from "@/lib/exam-store";
import { reviewHref } from "@/lib/review-href";
import type { CurrentRun } from "@/server/current-run";
import { finishRun, type GuestResult, saveRun } from "@/server/runs";
import { ExamIntro } from "./exam-intro";
import { ExamRail } from "./exam-rail";
import { ExamResult } from "./exam-result";
import { ExamTask } from "./exam-task";

interface ExamRunnerProps {
  variantId: string;
  tasks: Task[];
  minutes: number;
  title: string;
  signedIn: boolean;
  account?: CurrentRun;
  swaps?: (string | undefined)[];
  fallback?: ComposeMode;
}

export function ExamRunner({
  variantId,
  tasks,
  minutes,
  title,
  signedIn,
  account,
  swaps,
  fallback,
}: ExamRunnerProps) {
  const hydrated = useExamHydrated();
  const router = useRouter();
  const run = useExamStore((s) => s.runs[variantId]);
  const { start, answer, go, restore, clear } = useExamStore.getState();
  const [result, setResult] = useState<GuestResult>();
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
  const resumed = account?.variantId === variantId ? account.run : undefined;
  const synced = account?.run.updatedAt ?? 0;
  useEffect(() => {
    if (hydrated && resumed) restore(variantId, resumed);
  }, [hydrated, resumed, restore, variantId]);
  useEffect(() => {
    if (!signedIn || !run || run.updatedAt <= synced) return;
    const id = setTimeout(() => {
      const spent = spentAt(run, Date.now());
      saveRun(variantId, { ...run, spent }).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [signedIn, run, synced, variantId]);
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

  if (hydrated && !run && !resumed) {
    return (
      <ExamIntro
        title={title}
        signedIn={signedIn}
        tasks={tasks}
        minutes={minutes}
        swaps={swaps}
        fallback={fallback}
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
      const saved = await finishRun({
        runId: run.runId,
        variantId,
        startedAt: run.startedAt,
        answers: run.answers,
        durations: spentAt(run, Date.now()),
      });
      clear(variantId);
      if (saved.saved) router.push(reviewHref(run.runId));
      else setResult(saved);
    });

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
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
