"use server";

import { z } from "zod";
import { idsByTopic } from "@/features/tasks/tasks";
import { getSession } from "@/server/auth";
import { getTaskStatuses } from "./progress";
import type { TaskStatus } from "./status";

export async function getStatuses(
  topic: string,
): Promise<Record<string, TaskStatus>> {
  const session = await getSession();
  if (!session) return {};
  const ids = idsByTopic.get(z.string().parse(topic)) ?? [];
  return Object.fromEntries(await getTaskStatuses(session.user.id, ids));
}
