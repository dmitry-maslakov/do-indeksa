"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { FocusMode } from "@/components/focus-mode";
import { reviewHref } from "@/features/review/review";
import { useRouter } from "@/i18n/navigation";
import { useErrorText } from "@/lib/use-error-text";
import type { ComposeMode } from "./compose";
import type { CurrentRun } from "./current-run";
import { ExamGhost } from "./exam-ghost";
import { ExamIntro } from "./exam-intro";
import { ExamRail } from "./exam-rail";
import { spentAt, useExamHydrated, useExamStore } from "./exam-store";
import { ExamTask } from "./exam-task";
import { finishRun, saveRun } from "./run-actions";
import type { ExamTask as Task } from "./variants";

interface ExamRunnerProps {
  variantId: string;
  tasks: Task[];
  minutes: number;
  title: string;
  saved?: CurrentRun;
  swaps?: (string | undefined)[];
  fallback?: ComposeMode;
}

export function ExamRunner({
  variantId,
  tasks,
  minutes,
  title,
  saved,
  swaps,
  fallback,
}: ExamRunnerProps) {
  const hydrated = useExamHydrated();
  const router = useRouter();
  const run = useExamStore((s) => s.runs[variantId]);
  const { start, answer, go, restore, clear } = useExamStore.getState();
  const t = useTranslations("Exam");
  const errorText = useErrorText();
  const { execute: submit, isPending: pending } = useAction(finishRun, {
    onSuccess: ({ input }) => {
      clear(variantId);
      router.push(reviewHref(input.runId));
    },
    onError: () =>
      toast.error(t("finishFailed"), {
        description: errorText(),
      }),
  });
  const meta = useMemo(
    () => ({
      title,
      minutes,
      tasks: tasks.map((task) => ({
        number: task.number,
        topic: task.topicName,
        parts: task.parts.length,
      })),
    }),
    [title, minutes, tasks],
  );
  const resumed = saved?.variantId === variantId ? saved.run : undefined;
  const synced = saved?.run.updatedAt ?? 0;
  useEffect(() => {
    if (hydrated && resumed) restore(variantId, resumed);
  }, [hydrated, resumed, restore, variantId]);
  useEffect(() => {
    if (!run || run.updatedAt <= synced) return;
    const id = setTimeout(() => {
      const spent = spentAt(run, Date.now());
      saveRun({ ...run, spent, variantId }).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [run, synced, variantId]);
  const onAnswer = useCallback(
    (part: number, value: string) => answer(variantId, part, value),
    [answer, variantId],
  );

  if (hydrated && !run && !resumed) {
    return (
      <ExamIntro
        title={title}
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
    return <ExamGhost />;
  }

  const finish = () =>
    submit({
      runId: run.runId,
      variantId,
      startedAt: run.startedAt,
      answers: run.answers,
      durations: spentAt(run, Date.now()),
      timed: run.timed,
    });

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <FocusMode mode="exam" />
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
