"use client";

import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { FocusMode } from "@/components/focus-mode";
import { RailPanel } from "@/components/rail";
import { reviewHref } from "@/features/review/review";
import { getPathname, useRouter } from "@/i18n/navigation";
import { localTimeZone } from "@/lib/dates";
import { useErrorText } from "@/lib/use-error-text";
import { saveTest, submitTest } from "./actions";
import type { ComposeMode } from "./compose";
import { ExamBar } from "./exam-bar";
import { ExamGhost } from "./exam-ghost";
import { ExamRail } from "./exam-rail";
import {
  type LocalTest,
  useExamHydrated,
  useExamStore,
  visitsAt,
} from "./exam-store";
import { ExamTask } from "./exam-task";
import type { UnfinishedTest } from "./test-sessions";
import { isAnswered, nextIndex } from "./test-state";
import type { ExamTask as Task } from "./variants";

interface ExamRunnerProps {
  variantId: string;
  tasks: Task[];
  minutes: number;
  title: string;
  code?: string;
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
  code,
  saved,
  swaps,
  fallback,
}: ExamRunnerProps) {
  const hydrated = useExamHydrated();
  const router = useRouter();
  const test = useExamStore((s) => s.tests[variantId]);
  const { start, answer, go, restore, swap, clear } = useExamStore.getState();
  const t = useTranslations("Exam");
  const locale = useLocale();
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
      parts: tasks.map((task) => task.parts.length),
    }),
    [title, minutes, tasks],
  );
  const resumed = useMemo(
    (): LocalTest | undefined =>
      saved?.variantId === variantId
        ? {
            title,
            minutes,
            testId: saved.id,
            timed: saved.timed,
            startedAt: saved.startedAt,
            updatedAt: saved.updatedAt,
            current:
              nextIndex({ current: 0, answers: saved.draft.answers }) ?? 0,
            ...saved.draft,
          }
        : undefined,
    [saved, variantId, title, minutes],
  );
  const synced = saved?.updatedAt ?? 0;
  const opened = useRef(false);
  useEffect(() => {
    if (!hydrated || opened.current) return;
    opened.current = true;
    if (!resumed) start(variantId, meta);
  }, [hydrated, resumed, start, variantId, meta]);
  useEffect(() => {
    if (hydrated && resumed) restore(variantId, resumed);
  }, [hydrated, resumed, restore, variantId]);
  useEffect(() => {
    if (!test || test.updatedAt <= synced || test.updatedAt === test.startedAt)
      return;
    const id = setTimeout(() => {
      saveTest(payload(variantId, test)).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [test, synced, variantId]);
  const onAnswer = useCallback(
    (part: number, value: string) => answer(variantId, part, value),
    [answer, variantId],
  );

  const task = test && tasks[test.current];
  if (!test || !task) {
    return <ExamGhost />;
  }

  const answers = test.answers[test.current] ?? [];
  const swapTo = isAnswered(answers) ? undefined : swaps?.[test.current];
  const onSwap = swapTo
    ? () => {
        swap(variantId, swapTo);
        location.replace(getPathname({ href: `/variants/${swapTo}`, locale }));
      }
    : undefined;
  const rail = {
    test,
    tasks,
    pending,
    onGo: (i: number) => go(variantId, i),
    onFinish: () =>
      submit({ ...payload(variantId, test), tz: localTimeZone() }),
  };

  return (
    <>
      <FocusMode mode="exam" />
      <ExamBar {...rail} />
      <div className="flex items-start gap-14">
        <RailPanel label={t("tasks")}>
          <ExamRail {...rail} code={code} />
        </RailPanel>
        <div className="flex min-w-0 max-w-task flex-1 flex-col">
          {fallback && (
            <p className="pt-4.5 text-sm md:pt-3.5">
              {t("fallback", { mode: fallback })}
            </p>
          )}
          <ExamTask
            task={task}
            answers={answers}
            first={test.current === 0}
            last={test.current === tasks.length - 1}
            onSwap={onSwap}
            onAnswer={onAnswer}
            onPrev={() => go(variantId, test.current - 1)}
            onNext={() => go(variantId, test.current + 1)}
          />
        </div>
      </div>
    </>
  );
}
