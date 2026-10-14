import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { sets } from "@/db/schema";
import { db } from "@/server/db";
import { setCode } from "./set-code";

export async function saveSet(taskIds: string[]) {
  const code = setCode(taskIds);
  await db.insert(sets).values({ code, taskIds }).onConflictDoNothing();
  return code;
}

export const findSet = cache(async (code: string) => {
  const [row] = await db
    .select({ taskIds: sets.taskIds })
    .from(sets)
    .where(eq(sets.code, code));
  return row?.taskIds;
});
