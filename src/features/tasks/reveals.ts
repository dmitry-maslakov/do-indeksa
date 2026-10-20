import "server-only";
import { reveals } from "@/db/schema";
import { db } from "@/server/db";
import type { RevealOwner } from "./reveal-owner";
import type { RevealPart } from "./reveal-part";
import { openSessionIn } from "./sessions";
import { getTask } from "./tasks";

const hintParts = ["hint1", "hint2", "hint3"] as const;

function storedPart(taskId: string, part: RevealPart) {
  const task = getTask(taskId);
  if (!task) return;
  if (typeof part !== "number") return part;
  return part < task.hints.length ? hintParts[part] : undefined;
}

export async function recordReveal(
  profileId: string,
  taskId: string,
  part: RevealPart,
  owner: RevealOwner,
) {
  const stored = storedPart(taskId, part);
  if (!stored) return;
  if ("runId" in owner) {
    await db
      .insert(reveals)
      .values({ profileId, taskId, part: stored, runId: owner.runId });
    return;
  }
  await db.transaction(async (tx) => {
    await openSessionIn(tx, profileId, taskId, owner.session);
    await tx
      .insert(reveals)
      .values({ profileId, taskId, part: stored, sessionId: owner.session.id });
  });
}
