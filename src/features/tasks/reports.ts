import "server-only";
import { reports } from "@/db/schema";
import { db } from "@/server/db";

type Report = Pick<typeof reports.$inferInsert, "taskId" | "kind" | "message">;

export async function saveReport(userId: string, report: Report) {
  await db.insert(reports).values({ ...report, userId });
}
