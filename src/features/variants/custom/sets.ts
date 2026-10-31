import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { invariant } from "es-toolkit";
import { cache } from "react";
import { sets } from "@/db/schema";
import { db } from "@/server/db";
import { parseSetCode, setCode } from "./set-code";

export async function saveSet(taskIds: string[]) {
  const [row] = await db
    .insert(sets)
    .values({ taskIds })
    .onConflictDoUpdate({
      target: sets.taskIds,
      targetWhere: isNull(sets.code),
      set: { taskIds: sql`excluded.task_ids` },
    })
    .returning({ id: sets.id });
  invariant(row, "saving a set returned no row");
  return setCode(row.id);
}

export async function findSetCode(taskIds: string[]) {
  const [row] = await db
    .select({ id: sets.id })
    .from(sets)
    .where(and(eq(sets.taskIds, taskIds), isNull(sets.code)));
  return row && setCode(row.id);
}

export const findSet = cache(async (code: string) => {
  const parsed = parseSetCode(code);
  if (!parsed) return;
  const [row] = await db
    .select({ id: sets.id, taskIds: sets.taskIds })
    .from(sets)
    .where(
      "id" in parsed ? eq(sets.id, parsed.id) : eq(sets.code, parsed.legacy),
    );
  return row && { code: setCode(row.id), taskIds: row.taskIds };
});
