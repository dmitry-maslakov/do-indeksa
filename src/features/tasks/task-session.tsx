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
import { localTimeZone } from "@/lib/dates";
import { keepTaskSession } from "./session-action";

type Send = (sessionId?: string) => Promise<string | undefined>;

interface TaskSession {
  track: (send: Send) => Promise<string | undefined>;
  hints: number;
  solution: boolean;
  showHint: () => void;
  showSolution: () => void;
}

const keepAliveMs = 30_000;

const TaskSessionContext = createContext<TaskSession | null>(null);

export function TaskSessionProvider({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const latest = useRef(Promise.resolve<string | undefined>(undefined));
  const track = useCallback((send: Send) => {
    latest.current = latest.current.then(
      async (id) => (await send(id).catch(() => undefined)) ?? id,
    );
    return latest.current;
  }, []);
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState(false);

  useEffect(() => {
    const keep = () => {
      if (document.visibilityState !== "visible") return;
      track(
        async (sessionId) =>
          (await keepTaskSession({ taskId, sessionId, tz: localTimeZone() }))
            ?.data,
      );
    };
    keep();
    const timer = setInterval(keep, keepAliveMs);
    document.addEventListener("visibilitychange", keep);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", keep);
    };
  }, [taskId, track]);

  return (
    <TaskSessionContext
      value={{
        track,
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
