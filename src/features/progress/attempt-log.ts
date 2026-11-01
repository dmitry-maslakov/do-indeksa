import "server-only";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { cache } from "react";
import { isPractice, type SessionKind } from "@/db/columns";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { getTask } from "@/features/catalog/tasks";
import { db } from "@/server/db";
import { noId } from "@/server/profile";
import {
  difficultyOf,
  type LoggedReveal,
  type LoggedSubmit,
  type StoredSubmit,
  type TaskActivity,
  type TaskLog,
  type TaskLogs,
} from "./learning/types";

interface Row {
  taskId: string;
  at: number;
}

const isFirst = ({ kind }: { kind: SessionKind }) => kind === "first";

function toTaskLogs<S extends LoggedSubmit & Row & { tz: string | null }>(
  submits: S[],
  reveals: (LoggedReveal & Row)[],
  skips: Row[],
): TaskLog<S>[] {
  const submitsOf = Map.groupBy(submits, (s) => s.taskId);
  const revealsOf = Map.groupBy(reveals, (r) => r.taskId);
  const skipsOf = Map.groupBy(skips, (s) => s.taskId);
  const taskIds = new Set([...submitsOf.keys(), ...revealsOf.keys()]);
  return [...taskIds].flatMap((taskId) => {
    const task = getTask(taskId);
    if (!task) return [];
    const mine = (submitsOf.get(taskId) ?? []).toSorted((a, b) => a.at - b.at);
    return {
      taskId,
      topic: task.topic,
      type: task.type,
      difficulty: difficultyOf(task.difficulty),
      keyRev: task.keyRev,
      tz: mine.find((s) => s.tz)?.tz ?? null,
      lastTz: mine.findLast((s) => s.tz)?.tz ?? null,
      submits: mine,
      reveals: revealsOf.get(taskId) ?? [],
      skips: skipsOf.get(taskId)?.map((s) => s.at) ?? [],
    };
  });
}

const submitFields = {
  taskId: attempts.taskId,
  kind: taskSessions.kind,
  at: epochMs(attempts.createdAt),
  outcomes: attempts.outcomes,
  correct: attempts.correct,
  difficulty: attempts.difficulty,
  keyRev: attempts.keyRev,
  tz: taskSessions.tz,
};

const submitsWith = (where: SQL | undefined) =>
  db
    .select(submitFields)
    .from(attempts)
    .innerJoin(taskSessions, eq(taskSessions.id, attempts.sessionId))
    .where(where);

const storedWith = (where: SQL | undefined) =>
  db
    .select({ ...submitFields, id: attempts.id, answers: attempts.answers })
    .from(attempts)
    .innerJoin(taskSessions, eq(taskSessions.id, attempts.sessionId))
    .where(where);

async function readEvents<S>(
  readSubmits: (where: SQL | undefined) => PromiseLike<S[]>,
  profileId: string,
  taskIds?: string[],
) {
  const ofProfile = and(
    eq(taskSessions.profileId, profileId),
    taskIds && inArray(taskSessions.taskId, taskIds),
  );
  const [submits, opened, skipped] = await Promise.all([
    readSubmits(ofProfile),
    db
      .select({
        taskId: reveals.taskId,
        kind: taskSessions.kind,
        at: epochMs(reveals.createdAt),
        part: reveals.part,
      })
      .from(reveals)
      .innerJoin(taskSessions, eq(taskSessions.id, reveals.sessionId))
      .where(ofProfile),
    db
      .select({
        taskId: skips.taskId,
        kind: taskSessions.kind,
        at: epochMs(skips.createdAt),
      })
      .from(skips)
      .innerJoin(taskSessions, eq(taskSessions.id, skips.sessionId))
      .where(ofProfile),
  ]);
  return { submits, opened, skipped };
}

export async function getTaskLogs(profileId: string): Promise<TaskLogs> {
  if (profileId === noId) return { firstAttempts: [], taskLogs: [] };
  const { submits, opened, skipped } = await readEvents(submitsWith, profileId);
  return {
    firstAttempts: toTaskLogs(
      submits.filter(isFirst),
      opened.filter(isFirst),
      skipped.filter(isFirst),
    ),
    taskLogs: toTaskLogs(submits, opened, skipped),
  };
}

export async function getPracticeLogsOf(
  profileId: string,
  taskIds: string[],
): Promise<TaskLog<StoredSubmit>[]> {
  if (profileId === noId) return [];
  const { submits, opened, skipped } = await readEvents(
    storedWith,
    profileId,
    taskIds,
  );
  return toTaskLogs(
    submits.filter(isPractice),
    opened.filter(isPractice),
    skipped.filter(isPractice),
  );
}

export async function getTasksWith(
  table: typeof reveals | typeof skips,
  profileId: string,
  taskIds?: string[],
  ...conditions: (SQL | undefined)[]
) {
  const rows = await db
    .selectDistinct({ taskId: table.taskId })
    .from(table)
    .where(
      and(
        eq(table.profileId, profileId),
        taskIds && inArray(table.taskId, taskIds),
        ...conditions,
      ),
    );
  return new Set(rows.map((row) => row.taskId));
}

export const getShownTasks = cache(async (profileId: string) => {
  const rows = await db
    .selectDistinct({ taskId: reveals.taskId, kind: taskSessions.kind })
    .from(reveals)
    .innerJoin(taskSessions, eq(taskSessions.id, reveals.sessionId))
    .where(
      and(
        eq(reveals.profileId, profileId),
        inArray(reveals.part, ["answer", "solution"]),
      ),
    );
  return new Set(rows.filter(isPractice).map((row) => row.taskId));
});

export async function getActivity(profileId: string): Promise<TaskActivity[]> {
  if (profileId === noId) return [];
  const rows = await db
    .select({
      taskId: attempts.taskId,
      tz: taskSessions.tz,
      at: epochMs(attempts.createdAt),
    })
    .from(attempts)
    .innerJoin(taskSessions, eq(taskSessions.id, attempts.sessionId))
    .where(eq(attempts.profileId, profileId));
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task ? { ...row, topic: task.topic } : [];
  });
}
