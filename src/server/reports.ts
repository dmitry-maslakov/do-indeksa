"use server";

import { z } from "zod";
import { getTask } from "@/content/tasks";
import { reports } from "@/db/schema";
import { reportKinds } from "@/lib/report";
import { getSession } from "./auth";
import { db } from "./db";

const input = z.object({
  taskId: z.string().refine((id) => getTask(id) !== undefined),
  kind: z.enum(reportKinds),
  message: z.string().trim().max(1000),
});

type ReportState = "idle" | "sent" | "error";

export async function reportTask(
  _: ReportState,
  form: FormData,
): Promise<ReportState> {
  const report = input.safeParse(Object.fromEntries(form));
  if (!report.success) return "error";
  const session = await getSession();
  if (!session) return "error";
  try {
    await db
      .insert(reports)
      .values({ ...report.data, userId: session.user.id });
    return "sent";
  } catch (error) {
    console.error("report failed", error);
    return "error";
  }
}
