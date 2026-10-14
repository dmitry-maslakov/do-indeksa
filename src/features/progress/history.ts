import "server-only";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  type SQL,
  sql,
  sum,
} from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { attempts, runs } from "@/db/schema";
import { dayMs, timeZone } from "@/lib/dates";
import { db } from "@/server/db";
import { accuracyDays } from "./stats";
import { taskStats } from "./task-stats";

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

export const getRunAttempts = (userId: string, runIds: string[]) =>
  db
    .select({
      taskId: attempts.taskId,
      runId: attempts.runId,
      parts: attempts.parts,
      correct: attempts.correct,
      durationMs: attempts.durationMs,
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), inArray(attempts.runId, runIds)));

const newestRuns = (userId: string) =>
  db
    .select({
      id: runs.id,
      variantId: runs.variantId,
      taskIds: runs.taskIds,
      finishedAt: runs.finishedAt,
    })
    .from(runs)
    .where(eq(runs.userId, userId))
    .orderBy(desc(runs.finishedAt));

export const getRuns = cache(async (userId: string) => newestRuns(userId));

export const getRecentRuns = (userId: string, limit: number) =>
  newestRuns(userId).limit(limit);

export const countRuns = (userId: string) =>
  db.$count(runs, eq(runs.userId, userId));

const countWhere = (condition: SQL) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export async function getTaskStats(userId: string) {
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
    })
    .from(attempts)
    .where(eq(attempts.userId, userId))
    .groupBy(attempts.taskId);
  return taskStats(rows);
}

const streakWindowDays = 400;

export async function getRecentAttemptDays(userId: string) {
  const day = sql<string>`to_char(${attempts.createdAt} at time zone ${timeZone}, 'YYYY-MM-DD')`;
  const rows = await db
    .selectDistinct({ day })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        gte(
          attempts.createdAt,
          new Date(Date.now() - streakWindowDays * dayMs),
        ),
      ),
    );
  return rows.map((row) => row.day);
}
