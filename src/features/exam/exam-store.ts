import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Visit } from "./test-draft";

interface TestMeta {
  title: string;
  minutes: number;
  parts: number[];
}

export interface LocalTest extends Omit<TestMeta, "parts"> {
  testId: string;
  timed: boolean;
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

const withPart = (parts: string[], index: number, value: string) =>
  Array.from({ length: Math.max(parts.length, index + 1) }, (_, i) =>
    i === index ? value : (parts[i] ?? ""),
  );

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
  swap: (from: string, to: string) => void;
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
        start: (variantId, { title, minutes, parts }) =>
          set((s) => {
            if (s.tests[variantId]) return s;
            const now = Date.now();
            const test: LocalTest = {
              testId: crypto.randomUUID(),
              title,
              minutes,
              timed: true,
              startedAt: now,
              updatedAt: now,
              current: 0,
              answers: parts.map((count) =>
                Array.from({ length: count }, () => ""),
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
              i === test.current ? withPart(a, part, value) : a,
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
        swap: (from, to) =>
          set((s) => {
            const { [from]: test, ...tests } = s.tests;
            if (!test) return s;
            const now = Date.now();
            const swapped = {
              ...test,
              testId: crypto.randomUUID(),
              updatedAt: now,
              answers: test.answers.with(test.current, []),
              visits: [
                ...test.visits.filter((v) => v.task !== test.current),
                visit(test.current, now),
              ],
            };
            return { tests: { ...tests, [to]: swapped } };
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
