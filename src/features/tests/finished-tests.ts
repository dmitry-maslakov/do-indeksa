import "server-only";
import { and, between, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { alias, type SelectedFields } from "drizzle-orm/pg-core";
import { cache } from "react";
import { z } from "zod";
import { attempts, taskSessions, testSessions } from "@/db/schema";
import { sessionMs } from "@/features/progress/task-stats";
import { db } from "@/server/db";

const testIdStartingWith = (code: string) =>
  between(
    testSessions.id,
    `${code}-0000-0000-0000-000000000000`,
    `${code}-ffff-ffff-ffff-ffffffffffff`,
  );

const finished = isNotNull(testSessions.finishedAt);

const attemptSession = alias(taskSessions, "attempt_session");

const testTaskMs = sql<number>`(
  select coalesce(sum(${sessionMs}), 0) from ${taskSessions}
  where ${taskSessions.testSessionId} = ${testSessions.id}
    and ${taskSessions.taskId} = ${attempts.taskId}
)`.mapWith(Number);

const testAttempts = <T extends SelectedFields>(columns: T) =>
  db
    .select({ ...columns, durationMs: testTaskMs })
    .from(attempts)
    .innerJoin(attemptSession, eq(attemptSession.id, attempts.sessionId))
    .innerJoin(testSessions, eq(testSessions.id, attemptSession.testSessionId));

const testColumns = {
  id: testSessions.id,
  variantId: testSessions.variantId,
  taskIds: testSessions.taskIds,
  finishedAt: sql<Date>`${testSessions.finishedAt}`.mapWith(
    testSessions.finishedAt,
  ),
};

export const getTest = cache(async (profileId: string, key?: string) => {
  const id = z.uuid().safeParse(key);
  const code = z
    .string()
    .regex(/^[0-9a-f]{8}$/)
    .safeParse(key);
  if (key !== undefined && !id.success && !code.success) return undefined;
  const [test] = await db
    .select(testColumns)
    .from(testSessions)
    .where(
      and(
        eq(testSessions.profileId, profileId),
        finished,
        id.success ? eq(testSessions.id, id.data) : undefined,
        code.success ? testIdStartingWith(code.data) : undefined,
      ),
    )
    .orderBy(desc(testSessions.finishedAt))
    .limit(1);
  if (!test) return undefined;
  const rows = await testAttempts({
    taskId: attempts.taskId,
    answers: attempts.answers,
    outcomes: attempts.outcomes,
    correct: attempts.correct,
  }).where(
    and(eq(attempts.profileId, profileId), eq(testSessions.id, test.id)),
  );
  return { test, attempts: rows };
});

export const getTestAttempts = (profileId: string, testIds: string[]) =>
  testAttempts({
    taskId: attempts.taskId,
    testId: testSessions.id,
    outcomes: attempts.outcomes,
    correct: attempts.correct,
  }).where(
    and(eq(attempts.profileId, profileId), inArray(testSessions.id, testIds)),
  );

export const getTests = (profileId: string, limit: number, offset = 0) =>
  db
    .select(testColumns)
    .from(testSessions)
    .where(and(eq(testSessions.profileId, profileId), finished))
    .orderBy(desc(testSessions.finishedAt), desc(testSessions.id))
    .limit(limit)
    .offset(offset);

export const getLatestTests = (profileId: string, variantIds: string[]) =>
  db
    .selectDistinctOn([testSessions.variantId], testColumns)
    .from(testSessions)
    .where(
      and(
        eq(testSessions.profileId, profileId),
        finished,
        inArray(testSessions.variantId, variantIds),
      ),
    )
    .orderBy(testSessions.variantId, desc(testSessions.finishedAt));
