"use client";

import { useLocale, useTranslations } from "next-intl";
import { isNavigationError } from "next-safe-action";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useEffectEvent, useMemo } from "react";
import { toast } from "sonner";
import { RailPanel } from "@/components/rail";
import { saveTest, submitTest } from "@/features/tests/actions";
import { isAnswered, nextIndex } from "@/features/tests/state";
import type { UnfinishedTest } from "@/features/tests/test-sessions";
import { swapTask } from "@/features/variants/actions";
import type { ComposeMode } from "@/features/variants/custom/compose";
import { setId } from "@/features/variants/variant-id";
import type {
  ExamVariant,
  VariantTask as Task,
} from "@/features/variants/variants";
import { navigationStarted, queueEvent } from "@/lib/analytics-browser";
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
  swaps?: (string[] | undefined)[];
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
  const test = useTestStore((s) => s.tests[variantId]);
  const t = useTranslations("Exam");
  const locale = useLocale();
  const errorText = useErrorText();
  const { executeAsync: submit, isPending: pending } = useAction(submitTest, {
    onError: ({ error }) => {
      failed("test_finish", error.thrownError);
      toast.error(t("finishFailed"), {
        description: errorText(),
      });
    },
  });
  const { executeAsync: swapTasks } = useAction(swapTask, {
    onError: () => toast.error(errorText()),
  });
  const meta = {
    title,
    minutes,
    parts: tasks.map((task) => task.parts.length),
  };
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
  const open = useEffectEvent(() => {
    if (!resumed) start(variantId, meta);
  });
  useEffect(() => {
    if (hydrated) open();
  }, [hydrated]);
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
  const { goTo, recordInput, stats } = useTestViews(
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
        const to = setId(swapTo);
        navigationStarted("replace");
        swapTasks({ taskIds: swapTo, locale }).catch((error) => {
          const { tests } = useTestStore.getState();
          if (!isNavigationError(error) || !tests[variantId]) return;
          swap(variantId, to);
          recordSwap({
            test_session_id: test.testId,
            to_test_session_id: useTestStore.getState().tests[to]?.testId,
            position: test.current + 1,
            from_task_id: task.taskId,
            to_task_id: swapTo[test.current],
          });
        });
      }
    : undefined;
  const rail = {
    test,
    tasks,
    pending,
    onFinish: () => {
      recordInput();
      navigationStarted("push");
      submit({
        ...payload(variantId, test),
        tz: localTimeZone(),
        locale,
      }).catch((error) => {
        if (isNavigationError(error)) clear(variantId);
      });
    },
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
            <p className="pt-4.5 text-sm md:pt-3.5">{t("fallback")}</p>
          )}
          <TestTask
            task={task}
            answers={answers}
            first={test.current === 0}
            last={test.current === tasks.length - 1}
            stats={stats}
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
