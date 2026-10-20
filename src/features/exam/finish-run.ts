import "server-only";
import { and, eq } from "drizzle-orm";
import { attempts, currentRuns, runs } from "@/db/schema";
import { outcomesOf } from "@/features/review/outcomes";
import type { Outcomes, ReviewAttempt } from "@/features/review/review";
import { getTask } from "@/features/tasks/tasks";
import { db } from "@/server/db";
import { gradeRun } from "./grade";
import { overtimeAt } from "./run";
import { withinDay } from "./run-bounds";
import { getVariant, minutesOf, pointsOf } from "./variants";

export interface GuestResult {
  saved: false;
  attempts: ReviewAttempt[];
  outcomes: Outcomes;
}

export type RunResult = { saved: true } | GuestResult;

interface FinishedRun {
  runId: string;
  variantId: string;
  startedAt: number;
  answers: string[][];
  durations: number[];
  timed: boolean;
}

export async function saveFinishedRun(
  profileId: string | undefined,
  run: FinishedRun,
): Promise<RunResult> {
  const variant = getVariant(run.variantId);
  if (!variant) throw new Error(`unknown variant ${run.variantId}`);
  if (!withinDay(run.startedAt)) throw new Error("run is out of time bounds");

  const graded = gradeRun(
    variant.taskIds.map((taskId) => ({
      taskId,
      expected: getTask(taskId)?.check.map((c) => c.expected) ?? [],
      points: pointsOf(taskId),
    })),
    run.answers,
    run.durations,
  );
  const answered = graded.filter((g) => g.answered);

  if (!profileId) {
    return {
      saved: false,
      attempts: answered,
      outcomes: outcomesOf(answered),
    };
  }

  const now = Date.now();

  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(runs)
      .values({
        id: run.runId,
        profileId,
        kind: variant.kind,
        variantId: variant.id,
        taskIds: variant.taskIds,
        startedAt: new Date(run.startedAt),
        finishedAt: new Date(now),
        timed: run.timed,
        overtime: overtimeAt({ ...run, minutes: minutesOf(variant) }, now),
        durationsMs: graded.map((g) => g.durationMs),
      })
      .onConflictDoNothing()
      .returning({ id: runs.id });
    await tx
      .delete(currentRuns)
      .where(
        and(
          eq(currentRuns.profileId, profileId),
          eq(currentRuns.runId, run.runId),
        ),
      );
    if (!inserted || answered.length === 0) return;
    await tx
      .insert(attempts)
      .values(answered.map((g) => ({ ...g, profileId, runId: run.runId })));
  });
  return { saved: true };
}
