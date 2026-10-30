"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { keepTaskSession } from "@/features/practice/actions";
import { whenFieldReady } from "@/features/practice/answer/input-stats";
import type { Verdict } from "@/features/practice/answer/verdicts";
import {
  type BrowserEvents,
  type Intent,
  queueEvent,
  takeIntent,
} from "@/lib/analytics-browser";
import { localTimeZone } from "@/lib/time-zone";
import { keepAliveMs } from "./session-kind";

type Send = (sessionId?: string) => Promise<string | undefined>;

interface Visit {
  shownAt?: number;
  visibleMs: number;
  seq: number;
  typed: number;
  verdict?: Verdict;
  revealed: boolean;
  readyMs?: number;
}

type Exit = BrowserEvents["task_left"]["exit"];

interface TaskSession {
  track: (send: Send) => Promise<string | undefined>;
  note: (
    change: Partial<Pick<Visit, "typed" | "verdict" | "revealed">>,
  ) => void;
  hints: number;
  solution: boolean;
  showHint: () => void;
  showSolution: () => void;
}

const TaskSessionContext = createContext<TaskSession | null>(null);

function stateOf({ verdict, revealed, typed }: Visit) {
  if (verdict) return verdict === "correct" ? "solved" : verdict;
  if (revealed) return "revealed";
  return typed ? "typing" : "untouched";
}

function failed() {
  queueEvent("request_failed", {
    kind: "practice_action",
    reason: navigator.onLine ? "network" : "offline",
  });
  return undefined;
}

export function TaskSessionProvider({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const latest = useRef(Promise.resolve<string | undefined>(undefined));
  const sessionId = useRef<string>(undefined);
  const visit = useRef<Visit>({
    visibleMs: 0,
    seq: 0,
    typed: 0,
    revealed: false,
  });
  const track = useCallback((send: Send) => {
    latest.current = latest.current.then(async (id) => {
      sessionId.current = (await send(id).catch(failed)) ?? id;
      return sessionId.current;
    });
    return latest.current;
  }, []);
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState(false);

  useEffect(() => {
    const current = visit.current;
    const path = location.pathname;
    const keep = (intent?: Intent) => {
      if (document.visibilityState !== "visible") return;
      track(async (id) => {
        const kept = (
          await keepTaskSession({
            taskId,
            sessionId: id,
            tz: localTimeZone(),
            intent,
          })
        )?.data;
        if (id && kept && kept !== id)
          Object.assign(current, {
            visibleMs: 0,
            verdict: undefined,
            revealed: false,
          });
        return kept;
      });
    };
    const show = () => {
      current.shownAt = performance.now();
      keep();
    };
    const leave = (exit: Exit) => {
      if (current.shownAt !== undefined)
        current.visibleMs += performance.now() - current.shownAt;
      current.shownAt = undefined;
      current.seq += 1;
      queueEvent(
        "task_left",
        {
          task_id: taskId,
          task_session_id: sessionId.current,
          seq: current.seq,
          exit,
          state: stateOf(current),
          visible_ms: Math.round(current.visibleMs),
          typed_len: current.typed,
          field_ready_ms: current.readyMs,
        },
        path,
      );
    };
    const toggle = () =>
      document.visibilityState === "visible" ? show() : leave("hidden");
    const hide = () => leave("pagehide");
    whenFieldReady((ms) => {
      current.readyMs = ms;
    });
    if (document.visibilityState === "visible")
      current.shownAt = performance.now();
    keep(takeIntent());
    const timer = setInterval(keep, keepAliveMs);
    document.addEventListener("visibilitychange", toggle);
    addEventListener("pagehide", hide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", toggle);
      removeEventListener("pagehide", hide);
      leave("navigate");
    };
  }, [taskId, track]);

  return (
    <TaskSessionContext
      value={{
        track,
        note: (change) => Object.assign(visit.current, change),
        hints,
        solution,
        showHint: () => setHints((n) => n + 1),
        showSolution: () => setSolution(true),
      }}
    >
      {children}
    </TaskSessionContext>
  );
}

export function useTaskSession() {
  const value = use(TaskSessionContext);
  if (!value) throw new Error("useTaskSession needs a TaskSessionProvider");
  return value;
}
