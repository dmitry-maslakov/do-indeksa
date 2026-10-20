import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Visit } from "./test-draft";

interface TestMeta {
  title: string;
  minutes: number;
  timed: boolean;
  tasks: { number: number; topic: string; parts: number }[];
}

export interface LocalTest extends Omit<TestMeta, "tasks"> {
  testId: string;
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

export const visitsAt = (test: LocalTest, now: number) =>
  test.visits.map((v, i) =>
    i === test.visits.length - 1 ? { ...v, endedAt: now } : v,
  );

interface ExamState {
  tests: Record<string, LocalTest>;
  start: (variantId: string, meta: TestMeta) => void;
  answer: (variantId: string, part: number, value: string) => void;
  go: (variantId: string, index: number) => void;
  restore: (variantId: string, test: LocalTest) => void;
  clear: (variantId: string) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => {
      const update = (
        variantId: string,
        change: (test: LocalTest) => LocalTest,
      ) =>
        set((s) => {
          const test = s.tests[variantId];
          return test
            ? { tests: { ...s.tests, [variantId]: change(test) } }
            : s;
        });

      return {
        tests: {},
        start: (variantId, { title, minutes, timed, tasks }) =>
          set((s) => {
            if (s.tests[variantId]) return s;
            const now = Date.now();
            const test: LocalTest = {
              testId: crypto.randomUUID(),
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
            return { tests: { ...s.tests, [variantId]: test } };
          }),
        answer: (variantId, part, value) =>
          update(variantId, (test) => ({
            ...test,
            updatedAt: Date.now(),
            answers: test.answers.map((a, i) =>
              i === test.current
                ? a.map((v, j) => (j === part ? value : v))
                : a,
            ),
          })),
        go: (variantId, index) =>
          update(variantId, (test) => {
            const now = Date.now();
            return {
              ...test,
              current: index,
              updatedAt: now,
              visits: [...visitsAt(test, now), visit(index, now)],
            };
          }),
        restore: (variantId, test) =>
          set((s) => {
            const local = s.tests[variantId];
            if (local && local.updatedAt >= test.updatedAt) return s;
            const now = Date.now();
            const resumed = {
              ...test,
              visits: [...test.visits, visit(test.current, now)],
            };
            return { tests: { ...s.tests, [variantId]: resumed } };
          }),
        clear: (variantId) =>
          set((s) => {
            const { [variantId]: _, ...tests } = s.tests;
            return { tests };
          }),
      };
    },
    {
      name: "do-indeksa-exam",
      version: 4,
      migrate: () => ({ tests: {} }),
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
