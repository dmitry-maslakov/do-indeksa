import { attempt } from "es-toolkit";
import { type FormEvent, useEffect, useEffectEvent, useRef } from "react";
import {
  countInput,
  freshInput,
  takeInput,
} from "@/features/practice/answer/input-stats";
import { answeredCount, overtimeAt } from "@/features/tests/state";
import type { UnfinishedTest } from "@/features/tests/test-sessions";
import type { VariantTask } from "@/features/variants/variants";
import { type BrowserEvents, flush, queueEvent } from "@/lib/analytics-browser";
import { useTestStore } from "./test-store";

type Started = BrowserEvents["test_started"];
type Nav = BrowserEvents["test_task_viewed"]["nav"];
type Exit = BrowserEvents["test_left"]["exit"];

interface ViewedTest {
  variantId: string;
  kind: Started["variant_kind"];
  tasks: VariantTask[];
  saved?: UnfinishedTest;
  fallback?: Started["fallback"];
}

const swapKey = "swapped-test";
const leftAt = new Map<string, number>();

const testOf = (variantId: string) => useTestStore.getState().tests[variantId];

export function recordSwap(swapped: BrowserEvents["test_task_swapped"]) {
  queueEvent("test_task_swapped", swapped);
  attempt(() =>
    sessionStorage.setItem(swapKey, swapped.to_test_session_id ?? ""),
  );
}

export function useTestViews(
  { variantId, kind, tasks, saved, fallback }: ViewedTest,
  testId: string | undefined,
) {
  const input = useRef(freshInput());

  const recordInput = () => {
    const test = testOf(variantId);
    const task = test && tasks[test.current];
    const { focusAt, ...counts } = takeInput(input);
    if (!test || !task || !counts.inputs) return;
    queueEvent("answer_input", {
      context: "test",
      task_id: task.taskId,
      test_session_id: test.testId,
      position: test.current + 1,
      fields: task.parts.length,
      ...counts,
      latex_len: (test.answers[test.current] ?? []).join("").length,
    });
  };
  const recordInputOnLeave = useEffectEvent(recordInput);

  const view = (nav: Nav) => {
    const test = testOf(variantId);
    const task = test && tasks[test.current];
    if (!test || !task) return;
    const moved = nav !== "start" && nav !== "resume";
    const prev = moved ? test.visits.at(-2) : undefined;
    queueEvent("test_task_viewed", {
      test_session_id: test.testId,
      variant_kind: kind,
      position: test.current + 1,
      task_id: task.taskId,
      visit_no: test.visits.filter((v) => v.task === test.current).length,
      nav,
      prev_position: prev && prev.task + 1,
      prev_dwell_ms: prev && prev.endedAt - prev.startedAt,
      answered: answeredCount(test),
      elapsed_ms: Date.now() - test.startedAt,
    });
  };

  const show = useEffectEvent((id: string) => {
    const test = testOf(variantId);
    if (test?.testId !== id) return;
    const facts = {
      test_session_id: id,
      variant_id: variantId,
      variant_kind: kind,
      tasks: tasks.length,
      minutes: test.minutes,
    };
    const left = leftAt.get(id);
    const [, swapped] = attempt(() => sessionStorage.getItem(swapKey));
    const fresh = swapped === id || test.startedAt >= performance.timeOrigin;
    if (!left && fresh) {
      attempt(() => sessionStorage.removeItem(swapKey));
      queueEvent("test_started", { ...facts, fallback });
      view("start");
      return;
    }
    queueEvent("test_resumed", {
      ...facts,
      from: !left && test.updatedAt === saved?.updatedAt ? "server" : "local",
      away_ms: Date.now() - (left ?? test.updatedAt),
      answered: answeredCount(test),
    });
    view("resume");
  });

  useEffect(() => {
    if (!testId) return;
    show(testId);
    const path = location.pathname;
    let away = false;
    const leave = (exit: Exit) => {
      const test = testOf(variantId);
      if (away || test?.testId !== testId) return;
      away = true;
      recordInputOnLeave();
      const now = Date.now();
      leftAt.set(testId, now);
      queueEvent(
        "test_left",
        {
          test_session_id: testId,
          position: test.current + 1,
          answered: answeredCount(test),
          elapsed_ms: now - test.startedAt,
          over: overtimeAt(test, now),
          exit,
          seq: now,
        },
        path,
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") leave("hidden");
      else away = false;
    };
    const onPageHide = () => {
      leave("pagehide");
      flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("pagehide", onPageHide);
      leave("navigate");
    };
  }, [testId, variantId]);

  return {
    goTo: (index: number, nav: Nav) => {
      if (index === testOf(variantId)?.current) return;
      recordInput();
      useTestStore.getState().go(variantId, index);
      view(nav);
    },
    recordInput,
    onInput: (event: FormEvent) =>
      countInput(input.current, event.nativeEvent as InputEvent),
  };
}
