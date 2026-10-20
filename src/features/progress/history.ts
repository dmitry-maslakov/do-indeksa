import "server-only";
import {
  and,
  between,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias, type SelectedFields } from "drizzle-orm/pg-core";
import { cache } from "react";
import { z } from "zod";
import { attempts, taskSessions, testSessions } from "@/db/schema";
import { dayMs } from "@/lib/dates";
import { db } from "@/server/db";
import { decidesStatus } from "./decides-status";
import { accuracyDays } from "./stats";
import { taskStats } from "./task-stats";

const runIdStartingWith = (code: string) =>
  between(
    testSessions.id,
    `${code}-0000-0000-0000-000000000000`,
    `${code}-ffff-ffff-ffff-ffffffffffff`,
  );

const finished = isNotNull(testSessions.finishedAt);

const sessionMs = sql`extract(epoch from ${taskSessions.lastSeenAt} - ${taskSessions.startedAt}) * 1000`;

const attemptSession = alias(taskSessions, "attempt_session");

const runTaskMs = sql<number>`(
  select coalesce(sum(${sessionMs}), 0) from ${taskSessions}
  where ${taskSessions.testSessionId} = ${testSessions.id}
    and ${taskSessions.taskId} = ${attempts.taskId}
)`.mapWith(Number);

const runAttempts = <T extends SelectedFields>(columns: T) =>
  db
    .select({ ...columns, durationMs: runTaskMs })
    .from(attempts)
    .innerJoin(attemptSession, eq(attemptSession.id, attempts.sessionId))
    .innerJoin(testSessions, eq(testSessions.id, attemptSession.testSessionId));

const runColumns = {
  id: testSessions.id,
  variantId: testSessions.variantId,
  taskIds: testSessions.taskIds,
  finishedAt: sql<Date>`${testSessions.finishedAt}`.mapWith(
    testSessions.finishedAt,
  ),
};

export const getRun = cache(async (profileId: string, key?: string) => {
  const id = z.uuid().safeParse(key);
  const code = z
    .string()
    .regex(/^[0-9a-f]{8}$/)
    .safeParse(key);
  if (key !== undefined && !id.success && !code.success) return undefined;
  const [run] = await db
    .select(runColumns)
    .from(testSessions)
    .where(
      and(
        eq(testSessions.profileId, profileId),
        finished,
        id.success ? eq(testSessions.id, id.data) : undefined,
        code.success ? runIdStartingWith(code.data) : undefined,
      ),
    )
    .orderBy(desc(testSessions.finishedAt))
    .limit(1);
  if (!run) return undefined;
  const rows = await runAttempts({
    taskId: attempts.taskId,
    answers: attempts.answers,
    outcomes: attempts.outcomes,
    correct: attempts.correct,
  }).where(and(eq(attempts.profileId, profileId), eq(testSessions.id, run.id)));
  return { run, attempts: rows };
});

export const getRunAttempts = (profileId: string, runIds: string[]) =>
  runAttempts({
    taskId: attempts.taskId,
    runId: testSessions.id,
    outcomes: attempts.outcomes,
    correct: attempts.correct,
  }).where(
    and(eq(attempts.profileId, profileId), inArray(testSessions.id, runIds)),
  );

export const getRuns = (profileId: string, limit: number, offset = 0) =>
  db
    .select(runColumns)
    .from(testSessions)
    .where(and(eq(testSessions.profileId, profileId), finished))
    .orderBy(desc(testSessions.finishedAt), desc(testSessions.id))
    .limit(limit)
    .offset(offset);

export const getLatestRuns = (profileId: string, variantIds: string[]) =>
  db
    .selectDistinctOn([testSessions.variantId], runColumns)
    .from(testSessions)
    .where(
      and(
        eq(testSessions.profileId, profileId),
        finished,
        inArray(testSessions.variantId, variantIds),
      ),
    )
    .orderBy(testSessions.variantId, desc(testSessions.finishedAt));

export const countRuns = (profileId: string) =>
  db.$count(testSessions, and(eq(testSessions.profileId, profileId), finished));

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
  const rows = await db
    .select({
      taskId: taskSessions.taskId,
      ms: sql<number>`sum(${sessionMs})`.mapWith(Number),
    })
    .from(taskSessions)
    .where(eq(taskSessions.profileId, profileId))
    .groupBy(taskSessions.taskId);
  return new Map(rows.map((r) => [r.taskId, r.ms]));
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
