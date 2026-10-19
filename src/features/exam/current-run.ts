import "server-only";
import { and, eq, gt, notExists } from "drizzle-orm";
import { cache } from "react";
import { currentRuns, runs } from "@/db/schema";
import { dayMs } from "@/lib/dates";
import { db } from "@/server/db";
import type { ExamRun } from "./exam-store";
import { withinDay } from "./run-bounds";
import { getVariant } from "./variants";

export interface CurrentRun {
  variantId: string;
  run: ExamRun;
}

export const getCurrentRun = cache(
  async (userId: string): Promise<CurrentRun | undefined> => {
    const [row] = await db
      .select()
      .from(currentRuns)
      .where(
        and(
          eq(currentRuns.userId, userId),
          gt(currentRuns.startedAt, new Date(Date.now() - dayMs)),
          notExists(
            db
              .select({ id: runs.id })
              .from(runs)
              .where(eq(runs.id, currentRuns.runId)),
          ),
        ),
      );
    if (!row) return undefined;
    return {
      variantId: row.variantId,
      run: {
        ...row.run,
        runId: row.runId,
        startedAt: row.startedAt.getTime(),
        enteredAt: Date.now(),
      },
    };
  },
);

interface SavedRun {
  runId: string;
  variantId: string;
  startedAt: number;
  run: (typeof currentRuns.$inferInsert)["run"];
}

export async function saveCurrentRun(
  userId: string,
  { runId, variantId, startedAt, run }: SavedRun,
) {
  if (!getVariant(variantId) || !withinDay(startedAt)) return;
  const row = { runId, variantId, startedAt: new Date(startedAt), run };
  await db
    .insert(currentRuns)
    .values({ userId, ...row })
    .onConflictDoUpdate({
      target: currentRuns.userId,
      set: { ...row, updatedAt: new Date() },
    });
}
