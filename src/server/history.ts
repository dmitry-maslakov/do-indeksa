import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { attempts, runs } from "@/db/schema";
import { db } from "./db";

export const getRun = cache(async (userId: string, runId?: string) => {
  const id = z.uuid().safeParse(runId);
  const [run] = await db
    .select()
    .from(runs)
    .where(
      id.success
        ? and(eq(runs.userId, userId), eq(runs.id, id.data))
        : eq(runs.userId, userId),
    )
    .orderBy(desc(runs.finishedAt))
    .limit(1);
  if (!run) return undefined;
  const rows = await db
    .select({
      taskId: attempts.taskId,
      answers: attempts.answers,
      parts: attempts.parts,
      correct: attempts.correct,
      durationMs: attempts.durationMs,
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.runId, run.id)));
  return { run, attempts: rows };
});
