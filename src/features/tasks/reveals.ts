import "server-only";
import { reveals } from "@/db/schema";
import { db } from "@/server/db";
import type { RevealPart } from "./reveal-part";
import { getTask } from "./tasks";

const hintParts = ["hint1", "hint2", "hint3"] as const;

function storedPart(taskId: string, part: RevealPart) {
  const task = getTask(taskId);
  if (!task) return;
  if (typeof part !== "number") return part;
  return part < task.hints.length ? hintParts[part] : undefined;
}

export async function recordReveal(
  userId: string,
  taskId: string,
  part: RevealPart,
) {
  const stored = storedPart(taskId, part);
  if (!stored) return;
  await db.insert(reveals).values({ userId, taskId, part: stored });
}
