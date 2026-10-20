"use client";

import { noop } from "es-toolkit";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { openTaskSession } from "./session-action";
import type { SessionInput } from "./session-input";

interface TaskSession {
  session: SessionInput;
  hints: number;
  solution: boolean;
  showHint: () => void;
  showSolution: () => void;
}

const TaskSessionContext = createContext<TaskSession | null>(null);

export function TaskSessionProvider({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const [session] = useState(() => ({
    id: crypto.randomUUID(),
    startedAt: Date.now(),
  }));
  useEffect(() => {
    openTaskSession({ taskId, session }).catch(noop);
  }, [taskId, session]);
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState(false);
  return (
    <TaskSessionContext
      value={{
        session,
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
