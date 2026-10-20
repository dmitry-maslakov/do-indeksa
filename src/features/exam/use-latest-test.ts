import { maxBy } from "es-toolkit";
import { useExamHydrated, useExamStore } from "./exam-store";
import type { UnfinishedTest } from "./test-sessions";

interface Resumable {
  variantId: string;
  title: string;
  answers: string[][];
  updatedAt: number;
}

export function useLatestTest(saved?: UnfinishedTest) {
  const hydrated = useExamHydrated();
  const tests = useExamStore((s) => s.tests);
  const candidates: Resumable[] = hydrated
    ? Object.entries(tests).map(([variantId, test]) => ({ variantId, ...test }))
    : [];
  if (saved) candidates.push({ ...saved, answers: saved.draft.answers });
  return maxBy(candidates, (c) => c.updatedAt);
}
