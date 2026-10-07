"use server";

import type { TaskStatus } from "@/lib/progress";
import { getSession } from "./auth";
import { getProgress } from "./progress";

export async function getStatuses(): Promise<Record<string, TaskStatus>> {
  const session = await getSession();
  if (!session) return {};
  const { statuses } = await getProgress(session.user.id);
  return Object.fromEntries(statuses);
}
