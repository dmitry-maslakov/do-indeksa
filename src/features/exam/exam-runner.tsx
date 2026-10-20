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
import { ExamGhost } from "./exam-ghost";
import { ExamIntro } from "./exam-intro";
import { ExamRail } from "./exam-rail";
import {
  type LocalTest,
  useExamHydrated,
  useExamStore,
  visitsAt,
} from "./exam-store";
import { ExamTask } from "./exam-task";
import { saveTest, submitTest } from "./test-actions";
import type { UnfinishedTest } from "./test-sessions";
import { nextIndex } from "./test-state";
import type { ExamTask as Task } from "./variants";

interface ExamRunnerProps {
  variantId: string;
  tasks: Task[];
  minutes: number;
  title: string;
  saved?: UnfinishedTest;
  swaps?: (string | undefined)[];
  fallback?: ComposeMode;
}

const payload = (variantId: string, test: LocalTest) => ({
  id: test.testId,
  variantId,
  timed: test.timed,
  startedAt: test.startedAt,
  draft: { answers: test.answers, visits: visitsAt(test, Date.now()) },
});

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
  const test = useExamStore((s) => s.tests[variantId]);
  const { start, answer, go, restore, clear } = useExamStore.getState();
  const t = useTranslations("Exam");
  const errorText = useErrorText();
  const { execute: submit, isPending: pending } = useAction(submitTest, {
    onSuccess: ({ input }) => {
      clear(variantId);
      router.push(reviewHref(input.id));
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
  const resumed = useMemo(
    (): LocalTest | undefined =>
      saved?.variantId === variantId
        ? {
            ...meta,
            testId: saved.id,
            timed: saved.timed,
            startedAt: saved.startedAt,
            updatedAt: saved.updatedAt,
            current:
              nextIndex({ current: 0, answers: saved.draft.answers }) ?? 0,
            ...saved.draft,
          }
        : undefined,
    [saved, variantId, meta],
  );
  const synced = saved?.updatedAt ?? 0;
  useEffect(() => {
    if (hydrated && resumed) restore(variantId, resumed);
  }, [hydrated, resumed, restore, variantId]);
  useEffect(() => {
    if (!test || test.updatedAt <= synced) return;
    const id = setTimeout(() => {
      saveTest(payload(variantId, test)).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [test, synced, variantId]);
  const onAnswer = useCallback(
    (part: number, value: string) => answer(variantId, part, value),
    [answer, variantId],
  );

  if (hydrated && !test && !resumed) {
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

  const task = test && tasks[test.current];
  if (!test || !task) {
    return <ExamGhost />;
  }

  const finish = () => submit(payload(variantId, test));

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <FocusMode mode="exam" />
      <ExamRail
        test={test}
        tasks={tasks}
        minutes={minutes}
        pending={pending}
        onGo={(i) => go(variantId, i)}
        onFinish={finish}
      />
      <ExamTask
        task={task}
        answers={test.answers[test.current] ?? []}
        first={test.current === 0}
        last={test.current === tasks.length - 1}
        onAnswer={onAnswer}
        onPrev={() => go(variantId, test.current - 1)}
        onNext={() => go(variantId, test.current + 1)}
      />
    </div>
  );
}
