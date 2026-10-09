import "server-only";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { statAttempts } from "@/content/attempts";
import { attempts, runs } from "@/db/schema";
import { db } from "./db";

export const getRun = cache(async (userId: string, key?: string) => {
  const id = z.uuid().safeParse(key);
  const code = z
    .string()
    .regex(/^[0-9a-f]{8}$/)
    .safeParse(key);
  if (key !== undefined && !id.success && !code.success) return undefined;
  const [run] = await db
    .select()
    .from(runs)
    .where(
      and(
        eq(runs.userId, userId),
        id.success ? eq(runs.id, id.data) : undefined,
        code.success ? like(sql`${runs.id}::text`, `${code.data}%`) : undefined,
      ),
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

export const getAttempts = cache(async (userId: string) =>
  db
    .select({
      taskId: attempts.taskId,
      runId: attempts.runId,
      parts: attempts.parts,
      correct: attempts.correct,
      durationMs: attempts.durationMs,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .where(eq(attempts.userId, userId))
    .orderBy(desc(attempts.createdAt)),
);

export const getRuns = cache(async (userId: string) =>
  db
    .select({
      id: runs.id,
      variantId: runs.variantId,
      taskIds: runs.taskIds,
      finishedAt: runs.finishedAt,
    })
    .from(runs)
    .where(eq(runs.userId, userId))
    .orderBy(desc(runs.finishedAt)),
);

export const getStatAttempts = async (userId: string) =>
  statAttempts(await getAttempts(userId));
