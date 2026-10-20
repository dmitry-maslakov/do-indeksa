import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Visit } from "./test-draft";

interface RunMeta {
  title: string;
  minutes: number;
  timed: boolean;
  tasks: { number: number; topic: string; parts: number }[];
}

export interface ExamRun extends Omit<RunMeta, "tasks"> {
  runId: string;
  tasks: { number: number; topic: string }[];
  startedAt: number;
  updatedAt: number;
  current: number;
  answers: string[][];
  visits: Visit[];
}

const visit = (task: number, now: number): Visit => ({
  id: crypto.randomUUID(),
  task,
  startedAt: now,
  endedAt: now,
});

export const visitsAt = (run: ExamRun, now: number) =>
  run.visits.map((v, i) =>
    i === run.visits.length - 1 ? { ...v, endedAt: now } : v,
  );

interface ExamState {
  runs: Record<string, ExamRun>;
  start: (variantId: string, meta: RunMeta) => void;
  answer: (variantId: string, part: number, value: string) => void;
  go: (variantId: string, index: number) => void;
  restore: (variantId: string, run: ExamRun) => void;
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
        start: (variantId, { title, minutes, timed, tasks }) =>
          set((s) => {
            if (s.runs[variantId]) return s;
            const now = Date.now();
            const run: ExamRun = {
              runId: crypto.randomUUID(),
              title,
              minutes,
              timed,
              tasks: tasks.map(({ number, topic }) => ({ number, topic })),
              startedAt: now,
              updatedAt: now,
              current: 0,
              answers: tasks.map((t) =>
                Array.from({ length: t.parts }, () => ""),
              ),
              visits: [visit(0, now)],
            };
            return { runs: { ...s.runs, [variantId]: run } };
          }),
        answer: (variantId, part, value) =>
          update(variantId, (run) => ({
            ...run,
            updatedAt: Date.now(),
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
              updatedAt: now,
              visits: [...visitsAt(run, now), visit(index, now)],
            };
          }),
        restore: (variantId, run) =>
          set((s) => {
            const local = s.runs[variantId];
            if (local && local.updatedAt >= run.updatedAt) return s;
            const now = Date.now();
            const resumed = {
              ...run,
              visits: [...run.visits, visit(run.current, now)],
            };
            return { runs: { ...s.runs, [variantId]: resumed } };
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
      version: 3,
      migrate: () => ({ runs: {} }),
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export function useExamHydrated() {
  useEffect(() => {
    if (!useExamStore.persist.hasHydrated()) useExamStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    (onChange) => useExamStore.persist.onFinishHydration(onChange),
    () => useExamStore.persist.hasHydrated(),
    () => false,
  );
}
