"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { attempts, currentRuns, runs } from "@/db/schema";
import { outcomesOf } from "@/features/review/outcomes";
import type { Outcomes, ReviewAttempt } from "@/features/review/review";
import { getTask } from "@/features/tasks/tasks";
import { dayMs } from "@/lib/dates";
import { actionClient, authActionClient } from "@/server/action-client";
import { db } from "@/server/db";
import { gradeRun } from "./grade";
import { getVariant, pointsOf } from "./variants";

export interface GuestResult {
  saved: false;
  attempts: ReviewAttempt[];
  outcomes: Outcomes;
}

export type RunResult = { saved: true } | GuestResult;

const answers = z.array(z.array(z.string().max(500)).max(6)).max(10);
const durations = z.array(z.number().int().min(0)).max(10);

const runRef = z.object({
  runId: z.uuid(),
  variantId: z.string().min(1),
  startedAt: z.number().int(),
});

const finishInput = runRef.extend({ answers, durations });

const saveInput = runRef.extend({
  title: z.string().max(200),
  minutes: z.number().int(),
  timed: z.boolean(),
  tasks: z
    .array(z.object({ number: z.number().int(), topic: z.string().max(200) }))
    .max(10),
  updatedAt: z.number().int(),
  current: z.number().int().min(0).max(9),
  answers,
  spent: durations,
});

const inBounds = (startedAt: number) => {
  const now = Date.now();
  return startedAt <= now && startedAt >= now - dayMs;
};

export const saveRun = authActionClient
  .inputSchema(saveInput)
  .action(
    async ({
      parsedInput: { runId, variantId, startedAt, ...run },
      ctx: { userId },
    }) => {
      if (!getVariant(variantId) || !inBounds(startedAt)) return;
      const row = { runId, variantId, startedAt: new Date(startedAt), run };
      await db
        .insert(currentRuns)
        .values({ userId, ...row })
        .onConflictDoUpdate({
          target: currentRuns.userId,
          set: { ...row, updatedAt: new Date() },
        });
    },
  );

export const finishRun = actionClient
  .inputSchema(finishInput)
  .action(async ({ parsedInput: run, ctx: { userId } }): Promise<RunResult> => {
    const variant = getVariant(run.variantId);
    if (!variant) throw new Error(`unknown variant ${run.variantId}`);
    if (!inBounds(run.startedAt)) throw new Error("run is out of time bounds");

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

    if (!userId) {
      return {
        saved: false,
        attempts: answered,
        outcomes: outcomesOf(answered),
      };
    }

    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(runs)
        .values({
          id: run.runId,
          userId,
          kind: variant.kind,
          variantId: variant.id,
          taskIds: variant.taskIds,
          startedAt: new Date(run.startedAt),
        })
        .onConflictDoNothing()
        .returning({ id: runs.id });
      await tx
        .delete(currentRuns)
        .where(
          and(eq(currentRuns.userId, userId), eq(currentRuns.runId, run.runId)),
        );
      if (!inserted || answered.length === 0) return;
      await tx
        .insert(attempts)
        .values(answered.map((g) => ({ ...g, userId, runId: run.runId })));
    });
    refresh();
    return { saved: true };
  });
