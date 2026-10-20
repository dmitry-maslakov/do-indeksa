import "server-only";
import {
  and,
  between,
  count,
  desc,
  eq,
  gte,
  inArray,
  type SQL,
  sql,
  sum,
} from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { attempts, runs } from "@/db/schema";
import { dayMs } from "@/lib/dates";
import { db } from "@/server/db";
import { decidesStatus } from "./decides-status";
import { accuracyDays } from "./stats";
import { taskStats } from "./task-stats";

const runIdStartingWith = (code: string) =>
  between(
    runs.id,
    `${code}-0000-0000-0000-000000000000`,
    `${code}-ffff-ffff-ffff-ffffffffffff`,
  );

export const getRun = cache(async (profileId: string, key?: string) => {
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
        eq(runs.profileId, profileId),
        id.success ? eq(runs.id, id.data) : undefined,
        code.success ? runIdStartingWith(code.data) : undefined,
      ),
    )
    .orderBy(desc(runs.finishedAt))
    .limit(1);
  if (!run) return undefined;
  const rows = await db
    .select({
      taskId: attempts.taskId,
      answers: attempts.answers,
      outcomes: attempts.outcomes,
      correct: attempts.correct,
      durationMs: attempts.durationMs,
    })
    .from(attempts)
    .where(and(eq(attempts.profileId, profileId), eq(attempts.runId, run.id)));
  return { run, attempts: rows };
});

export const getRunAttempts = (profileId: string, runIds: string[]) =>
  db
    .select({
      taskId: attempts.taskId,
      runId: attempts.runId,
      outcomes: attempts.outcomes,
      correct: attempts.correct,
      durationMs: attempts.durationMs,
    })
    .from(attempts)
    .where(
      and(eq(attempts.profileId, profileId), inArray(attempts.runId, runIds)),
    );

const runColumns = {
  id: runs.id,
  variantId: runs.variantId,
  taskIds: runs.taskIds,
  finishedAt: runs.finishedAt,
};

export const getRuns = (profileId: string, limit: number, offset = 0) =>
  db
    .select(runColumns)
    .from(runs)
    .where(eq(runs.profileId, profileId))
    .orderBy(desc(runs.finishedAt), desc(runs.id))
    .limit(limit)
    .offset(offset);

export const getLatestRuns = (profileId: string, variantIds: string[]) =>
  db
    .selectDistinctOn([runs.variantId], runColumns)
    .from(runs)
    .where(
      and(eq(runs.profileId, profileId), inArray(runs.variantId, variantIds)),
    )
    .orderBy(runs.variantId, desc(runs.finishedAt));

export const countRuns = (profileId: string) =>
  db.$count(runs, eq(runs.profileId, profileId));

const countWhere = (condition: SQL) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export async function getTaskStats(profileId: string) {
  const recent = gte(
    attempts.createdAt,
    new Date(Date.now() - accuracyDays * dayMs),
  );
  const right = eq(attempts.correct, true);
  const rows = await db
    .select({
      taskId: attempts.taskId,
      attempts: count(),
      right: countWhere(right),
      recentAttempts: countWhere(recent),
      recentRight: countWhere(sql`${recent} and ${right}`),
      durationMs: sum(attempts.durationMs).mapWith(Number),
      firstRight: sql<boolean>`(array_agg(${attempts.correct} order by ${attempts.createdAt}))[1]`,
      latestRight: sql<boolean>`(array_agg(${attempts.correct} order by ${attempts.createdAt} desc))[1]`,
      lastAt:
        sql`extract(epoch from max(${attempts.createdAt})) * 1000`.mapWith(
          Number,
        ),
    })
    .from(attempts)
    .where(and(eq(attempts.profileId, profileId), decidesStatus))
    .groupBy(attempts.taskId);
  return taskStats(rows);
}

export const getLatestResults = async (
  profileId: string,
  taskIds: string[],
  limit: number,
) =>
  (
    await db
      .select({ correct: attempts.correct })
      .from(attempts)
      .where(
        and(
          eq(attempts.profileId, profileId),
          inArray(attempts.taskId, taskIds),
          decidesStatus,
        ),
      )
      .orderBy(desc(attempts.createdAt))
      .limit(limit)
  ).map((row) => row.correct);
