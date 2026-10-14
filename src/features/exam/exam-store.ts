import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DAY } from "@/lib/dates";

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
  enteredAt: number;
  updatedAt: number;
  current: number;
  answers: string[][];
  spent: number[];
}

const fresh = (runs: Record<string, ExamRun>) => {
  const cutoff = Date.now() - DAY;
  return Object.fromEntries(
    Object.entries(runs).filter(([, run]) => run.startedAt >= cutoff),
  );
};

export const spentAt = (run: ExamRun, now: number) =>
  run.spent.map((ms, i) => (i === run.current ? ms + now - run.enteredAt : ms));

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
              enteredAt: now,
              updatedAt: now,
              current: 0,
              answers: tasks.map((t) =>
                Array.from({ length: t.parts }, () => ""),
              ),
              spent: tasks.map(() => 0),
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
              enteredAt: now,
              updatedAt: now,
              spent: spentAt(run, now),
            };
          }),
        restore: (variantId, run) =>
          set((s) => {
            const local = s.runs[variantId];
            return local && local.updatedAt >= run.updatedAt
              ? s
              : { runs: { ...s.runs, [variantId]: run } };
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
      version: 2,
      migrate: (persisted, version) => {
        if (version !== 1) return { runs: {} };
        const { runs } = persisted as Pick<ExamState, "runs">;
        return {
          runs: Object.fromEntries(
            Object.entries(runs).map(([id, run]) => [
              id,
              { ...run, updatedAt: run.enteredAt },
            ]),
          ),
        };
      },
      merge: (persisted, current) => {
        const { runs = current.runs } = (persisted ?? {}) as Partial<
          Pick<ExamState, "runs">
        >;
        return { ...current, runs: fresh(runs) };
      },
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
