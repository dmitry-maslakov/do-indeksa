"use client";

import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { RailPanel } from "@/components/rail";
import { saveTest, submitTest } from "@/features/tests/actions";
import { reviewHref } from "@/features/tests/review";
import { isAnswered, nextIndex } from "@/features/tests/state";
import type { UnfinishedTest } from "@/features/tests/test-sessions";
import type { ComposeMode } from "@/features/variants/custom/compose";
import { parseVariantId } from "@/features/variants/variant-id";
import type {
  ExamVariant,
  VariantTask as Task,
} from "@/features/variants/variants";
import { getPathname, useRouter } from "@/i18n/navigation";
import { queueEvent } from "@/lib/analytics-browser";
import { localTimeZone } from "@/lib/time-zone";
import { useErrorText } from "@/lib/use-error-text";
import { TestBar } from "./test-bar";
import { TestGhost } from "./test-ghost";
import { TestRail } from "./test-rail";
import {
  type LocalTest,
  useTestHydrated,
  useTestStore,
  visitsAt,
} from "./test-store";
import { TestTask } from "./test-task";
import { recordSwap, useTestViews } from "./use-test-views";

const { start, answer, restore, swap, clear } = useTestStore.getState();

interface TestRunnerProps {
  variantId: string;
  kind: ExamVariant["kind"];
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
  startedAt: test.startedAt,
  draft: { answers: test.answers, visits: visitsAt(test, Date.now()) },
});

const failed = (kind: "test_save" | "test_finish", thrown?: unknown) =>
  queueEvent("request_failed", {
    kind,
    reason: !thrown ? "server" : navigator.onLine ? "network" : "offline",
  });

export function TestRunner({
  variantId,
  kind,
  tasks,
  minutes,
  title,
  code,
  saved,
  swaps,
  fallback,
}: TestRunnerProps) {
  const hydrated = useTestHydrated();
  const router = useRouter();
  const test = useTestStore((s) => s.tests[variantId]);
  const t = useTranslations("Exam");
  const locale = useLocale();
  const errorText = useErrorText();
  const { execute: submit, isPending: pending } = useAction(submitTest, {
    onSuccess: ({ input }) => {
      clear(variantId);
      router.push(reviewHref(input.id));
    },
    onError: ({ error }) => {
      failed("test_finish", error.thrownError);
      toast.error(t("finishFailed"), {
        description: errorText(),
      });
    },
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
  }, [hydrated, resumed, variantId, meta]);
  useEffect(() => {
    if (hydrated && resumed) restore(variantId, resumed);
  }, [hydrated, resumed, variantId]);
  useEffect(() => {
    if (!test || test.updatedAt <= synced || test.updatedAt === test.startedAt)
      return;
    const id = setTimeout(() => {
      saveTest(payload(variantId, test)).then(
        (result) =>
          (result?.serverError || result?.validationErrors) &&
          failed("test_save"),
        (error) => failed("test_save", error),
      );
    }, 1500);
    return () => clearTimeout(id);
  }, [test, synced, variantId]);
  const goTo = useTestViews(
    { variantId, kind, tasks, saved, fallback },
    hydrated ? test?.testId : undefined,
  );
  const onAnswer = (part: number, value: string) =>
    answer(variantId, part, value);

  const task = test && tasks[test.current];
  if (!test || !task) {
    return <TestGhost />;
  }

  const answers = test.answers[test.current] ?? [];
  const swapTo = isAnswered(answers) ? undefined : swaps?.[test.current];
  const onSwap = swapTo
    ? () => {
        swap(variantId, swapTo);
        location.replace(getPathname({ href: `/variants/${swapTo}`, locale }));
        recordSwap({
          test_session_id: test.testId,
          to_test_session_id: useTestStore.getState().tests[swapTo]?.testId,
          position: test.current + 1,
          from_task_id: task.taskId,
          to_task_id: parseVariantId(swapTo)?.taskIds[test.current],
        });
      }
    : undefined;
  const rail = {
    test,
    tasks,
    pending,
    onFinish: () =>
      submit({ ...payload(variantId, test), tz: localTimeZone() }),
  };

  return (
    <>
      <TestBar {...rail} onGo={(i) => goTo(i, "bar")} />
      <div className="flex items-start gap-14">
        <RailPanel label={t("tasks")}>
          <TestRail {...rail} code={code} onGo={(i) => goTo(i, "rail")} />
        </RailPanel>
        <div className="flex min-w-0 max-w-task flex-1 flex-col">
          {fallback && (
            <p className="pt-4.5 text-sm md:pt-3.5">
              {t("fallback", { mode: fallback })}
            </p>
          )}
          <TestTask
            task={task}
            answers={answers}
            first={test.current === 0}
            last={test.current === tasks.length - 1}
            onSwap={onSwap}
            onAnswer={onAnswer}
            onPrev={() => goTo(test.current - 1, "prev")}
            onNext={() => goTo(test.current + 1, "next")}
          />
        </div>
      </div>
    </>
  );
}
