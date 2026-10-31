import "server-only";
import { eq, max } from "drizzle-orm";
import type { SessionKind } from "@/db/columns";
import { attempts, reveals, skips, taskSessions } from "@/db/schema";
import { epochMs } from "@/db/sql";
import { getTask } from "@/features/catalog/tasks";
import { db } from "@/server/db";
import {
  difficultyOf,
  type LoggedReveal,
  type LoggedSubmit,
  type TaskActivity,
  type TaskLog,
} from "./learning/types";

interface Row {
  taskId: string;
  at: number;
}

const isFirst = ({ kind }: { kind: SessionKind }) => kind === "first";

function toTaskLogs(
  submits: (LoggedSubmit & Row & { tz: string | null })[],
  reveals: (LoggedReveal & Row)[],
  skips: Row[],
): TaskLog[] {
  const submitsOf = Map.groupBy(submits, (s) => s.taskId);
  const revealsOf = Map.groupBy(reveals, (r) => r.taskId);
  const skipsOf = Map.groupBy(skips, (s) => s.taskId);
  const taskIds = new Set([...submitsOf.keys(), ...revealsOf.keys()]);
  return [...taskIds].flatMap((taskId) => {
    const task = getTask(taskId);
    if (!task) return [];
    const mine = submitsOf.get(taskId) ?? [];
    return {
      taskId,
      topic: task.topic,
      difficulty: difficultyOf(task.difficulty),
      keyRev: task.keyRev,
      tz: mine.find((s) => s.tz)?.tz ?? null,
      submits: mine,
      reveals: revealsOf.get(taskId) ?? [],
      skips: skipsOf.get(taskId)?.map((s) => s.at) ?? [],
    };
  });
}

export async function getTaskLogs(profileId: string) {
  const ofProfile = eq(taskSessions.profileId, profileId);
  const [submits, opened, skipped] = await Promise.all([
    db
      .select({
        taskId: attempts.taskId,
        kind: taskSessions.kind,
        at: epochMs(attempts.createdAt),
        outcomes: attempts.outcomes,
        correct: attempts.correct,
        difficulty: attempts.difficulty,
        keyRev: attempts.keyRev,
        tz: taskSessions.tz,
      })
      .from(attempts)
      .innerJoin(taskSessions, eq(taskSessions.id, attempts.sessionId))
      .where(ofProfile),
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
  return {
    firstAttempts: toTaskLogs(
      submits.filter(isFirst),
      opened.filter(isFirst),
      skipped.filter(isFirst),
    ),
    taskLogs: toTaskLogs(submits, opened, skipped),
  };
}

export async function getActivity(profileId: string): Promise<TaskActivity[]> {
  const rows = await db
    .select({
      taskId: attempts.taskId,
      tz: taskSessions.tz,
      at: epochMs(max(attempts.createdAt)),
    })
    .from(attempts)
    .innerJoin(taskSessions, eq(taskSessions.id, attempts.sessionId))
    .where(eq(attempts.profileId, profileId))
    .groupBy(attempts.taskId, taskSessions.tz);
  return rows.flatMap((row) => {
    const task = getTask(row.taskId);
    return task ? { ...row, topic: task.topic } : [];
  });
}
