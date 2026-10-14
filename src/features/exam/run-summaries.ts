import "server-only";
import type { Locale } from "next-intl";
import { review } from "@/features/review/review";
import type { Segment } from "@/lib/strip";
import { variantTitle } from "./variant-title";
import { getVariant, tasksFor } from "./variants";

interface RunRow {
  id: string;
  variantId: string;
  taskIds: string[];
  finishedAt: Date;
}

interface AttemptRow {
  taskId: string;
  runId: string | null;
  parts: boolean[];
  correct: boolean;
  durationMs: number;
}

export interface RunSummary {
  id: string;
  variantId: string;
  title: string;
  finishedAt: Date;
  segments: Segment[];
  misses: number[];
  score: number;
  max: number;
}

export function summarizeRuns(
  runs: RunRow[],
  attempts: AttemptRow[],
  locale: Locale,
): Promise<RunSummary[]> {
  const byRun = Map.groupBy(attempts, (a) => a.runId);
  return Promise.all(
    runs.map(async (run) => {
      const variant = getVariant(run.variantId);
      const result = review(
        (await tasksFor(run.taskIds, locale)).map((task) => ({
          ...task,
          taskId: task.id,
        })),
        byRun.get(run.id) ?? [],
      );
      return {
        id: run.id,
        variantId: run.variantId,
        title: variant ? await variantTitle(variant) : run.variantId,
        finishedAt: run.finishedAt,
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
