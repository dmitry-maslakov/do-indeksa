import "server-only";
import type { Locale } from "next-intl";
import { getRunAttempts } from "@/features/progress/history";
import { review } from "@/features/review/review";
import type { Segment } from "@/lib/strip";
import { variantTitle } from "./variant-title";
import { getVariant, reviewTasks } from "./variants";

export interface RunRow {
  id: string;
  variantId: string;
  taskIds: string[];
  finishedAt: Date;
}

export interface RunSummary {
  id: string;
  variantId: string;
  title: string;
  finishedAt: number;
  segments: Segment[];
  misses: number[];
  score: number;
  max: number;
}

export async function summarizeRuns(
  userId: string,
  runs: RunRow[],
  locale: Locale,
): Promise<RunSummary[]> {
  const attempts = await getRunAttempts(
    userId,
    runs.map((run) => run.id),
  );
  const byRun = Map.groupBy(attempts, (a) => a.runId);
  return Promise.all(
    runs.map(async (run) => {
      const variant = getVariant(run.variantId);
      const result = review(reviewTasks(run.taskIds), byRun.get(run.id) ?? []);
      return {
        id: run.id,
        variantId: run.variantId,
        title: variant ? await variantTitle(variant, locale) : run.variantId,
        finishedAt: run.finishedAt.getTime(),
        segments: result.rows.map((r) => r.segment),
        misses: result.rows
          .filter((r) => r.earned < r.points)
          .map((r) => r.number),
        score: result.score,
        max: result.max,
      };
    }),
  );
}
