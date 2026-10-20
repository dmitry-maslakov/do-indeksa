import type { CurrentRun } from "./current-run";
import { type ExamRun, useExamHydrated, useExamStore } from "./exam-store";

type Entry = [variantId: string, run: ExamRun];

export function useLatestRun(account?: CurrentRun) {
  const hydrated = useExamHydrated();
  const runs = useExamStore((s) => s.runs);
  const candidates: Entry[] = hydrated ? Object.entries(runs) : [];
  if (account) candidates.push([account.variantId, account.run]);
  return candidates.reduce<Entry | undefined>(
    (best, candidate) =>
      !best || candidate[1].updatedAt > best[1].updatedAt ? candidate : best,
    undefined,
  );
}
