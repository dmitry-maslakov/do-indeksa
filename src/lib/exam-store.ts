import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ExamRun {
  runId: string;
  timed: boolean;
  startedAt: number;
  enteredAt: number;
  current: number;
  answers: string[][];
  spent: number[];
}

interface ExamState {
  runs: Record<string, ExamRun>;
  start: (variantId: string, parts: number[], timed: boolean) => void;
  answer: (variantId: string, part: number, value: string) => void;
  go: (variantId: string, index: number) => void;
  clear: (variantId: string) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => {
      const update = (variantId: string, change: (run: ExamRun) => ExamRun) =>
        set((s) => {
          const run = s.runs[variantId];
          return run ? { runs: { ...s.runs, [variantId]: change(run) } } : s;
        });

      return {
        runs: {},
        start: (variantId, parts, timed) =>
          set((s) => {
            if (s.runs[variantId]) return s;
            const now = Date.now();
            const run: ExamRun = {
              runId: crypto.randomUUID(),
              timed,
              startedAt: now,
              enteredAt: now,
              current: 0,
              answers: parts.map((n) => Array.from({ length: n }, () => "")),
              spent: parts.map(() => 0),
            };
            return { runs: { ...s.runs, [variantId]: run } };
          }),
        answer: (variantId, part, value) =>
          update(variantId, (run) => ({
            ...run,
            answers: run.answers.map((a, i) =>
              i === run.current ? a.map((v, j) => (j === part ? value : v)) : a,
            ),
          })),
        go: (variantId, index) =>
          update(variantId, (run) => {
            const now = Date.now();
            return {
              ...run,
              current: index,
              enteredAt: now,
              spent: run.spent.map((ms, i) =>
                i === run.current ? ms + now - run.enteredAt : ms,
              ),
            };
          }),
        clear: (variantId) =>
          set((s) => {
            const { [variantId]: _, ...runs } = s.runs;
            return { runs };
          }),
      };
    },
    {
      name: "do-indeksa-exam",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export function useExamHydrated() {
  useEffect(() => {
    useExamStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    (onChange) => useExamStore.persist.onFinishHydration(onChange),
    () => useExamStore.persist.hasHydrated(),
    () => false,
  );
}
