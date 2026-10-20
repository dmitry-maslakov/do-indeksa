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
} from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { attempts, runs, taskSessions } from "@/db/schema";
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

const runTaskMs =
  sql<number>`coalesce((${runs.durationsMs})[array_position(${runs.taskIds}, ${attempts.taskId})], 0)`.mapWith(
    Number,
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
      durationMs: runTaskMs,
    })
    .from(attempts)
    .innerJoin(runs, eq(runs.id, attempts.runId))
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
      durationMs: runTaskMs,
    })
    .from(attempts)
    .innerJoin(runs, eq(runs.id, attempts.runId))
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
  const time = await getTimeByTask(profileId);
  return taskStats(
    rows.map((row) => ({ ...row, durationMs: time.get(row.taskId) ?? 0 })),
  );
}

async function getTimeByTask(profileId: string) {
  const [sessions, tests] = await Promise.all([
    db
      .select({
        taskId: taskSessions.taskId,
        ms: sql<number>`sum(extract(epoch from ${taskSessions.lastSeenAt} - ${taskSessions.startedAt}) * 1000)`.mapWith(
          Number,
        ),
      })
      .from(taskSessions)
      .where(eq(taskSessions.profileId, profileId))
      .groupBy(taskSessions.taskId),
    db
      .select({
        taskId: sql<string>`unnest(${runs.taskIds})`,
        ms: sql<number>`unnest(${runs.durationsMs})`.mapWith(Number),
      })
      .from(runs)
      .where(eq(runs.profileId, profileId)),
  ]);
  return [...sessions, ...tests].reduce(
    (all, { taskId, ms }) => all.set(taskId, (all.get(taskId) ?? 0) + ms),
    new Map<string, number>(),
  );
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
