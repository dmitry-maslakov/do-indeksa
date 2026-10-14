"use server";

import { z } from "zod";
import { idsByTopic } from "@/features/tasks/tasks";
import type { TaskStatus } from "@/lib/progress";
import { getSession } from "./auth";
import { getTaskStatuses } from "./progress";

export async function getStatuses(
  topic: string,
): Promise<Record<string, TaskStatus>> {
  const session = await getSession();
  if (!session) return {};
  const ids = idsByTopic.get(z.string().parse(topic)) ?? [];
  return Object.fromEntries(await getTaskStatuses(session.user.id, ids));
}
