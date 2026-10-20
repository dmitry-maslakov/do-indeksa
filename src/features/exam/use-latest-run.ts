import { maxBy } from "es-toolkit";
import { useExamHydrated, useExamStore } from "./exam-store";
import type { UnfinishedTest } from "./test-sessions";

interface Resumable {
  variantId: string;
  title: string;
  answers: string[][];
  updatedAt: number;
}

export function useLatestRun(saved?: UnfinishedTest) {
  const hydrated = useExamHydrated();
  const runs = useExamStore((s) => s.runs);
  const candidates: Resumable[] = hydrated
    ? Object.entries(runs).map(([variantId, run]) => ({ variantId, ...run }))
    : [];
  if (saved) candidates.push({ ...saved, answers: saved.draft.answers });
  return maxBy(candidates, (c) => c.updatedAt);
}
