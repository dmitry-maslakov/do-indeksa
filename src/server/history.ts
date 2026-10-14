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
import { taskStats } from "@/content/task-stats";
import { attempts, runs } from "@/db/schema";
import { DAY, TIME_ZONE } from "@/lib/dates";
import { ACCURACY_DAYS } from "@/lib/stats";
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

const countWhere = (condition: SQL) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export async function getTaskStats(userId: string) {
  const recent = gte(
    attempts.createdAt,
    new Date(Date.now() - ACCURACY_DAYS * DAY),
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

const RECENT_DAYS = 400;

export async function getRecentAttemptDays(userId: string) {
  const day = sql<string>`to_char(${attempts.createdAt} at time zone ${TIME_ZONE}, 'YYYY-MM-DD')`;
  const rows = await db
    .selectDistinct({ day })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        gte(attempts.createdAt, new Date(Date.now() - RECENT_DAYS * DAY)),
      ),
    );
  return rows.map((row) => row.day);
}
