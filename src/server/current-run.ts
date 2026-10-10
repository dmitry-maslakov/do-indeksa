import "server-only";
import { and, eq, gt, notExists } from "drizzle-orm";
import { cache } from "react";
import { currentRuns, runs } from "@/db/schema";
import { DAY } from "@/lib/dates";
import type { ExamRun } from "@/lib/exam-store";
import { db } from "./db";

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
          gt(currentRuns.startedAt, new Date(Date.now() - DAY)),
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
