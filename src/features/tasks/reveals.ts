import "server-only";
import { reveals } from "@/db/schema";
import { getTask } from "@/features/catalog/tasks";
import { db } from "@/server/db";
import type { RevealOwner } from "./reveal-owner";
import type { RevealPart } from "./reveal-part";
import { liveSession, testTaskSession } from "./sessions";

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
  return db.transaction(async (tx) => {
    const sessionId =
      "testSessionId" in owner
        ? await testTaskSession(tx, profileId, taskId, owner.testSessionId)
        : await liveSession(tx, profileId, taskId, owner.sessionId);
    await tx
      .insert(reveals)
      .values({ profileId, taskId, part: stored, sessionId });
    return sessionId;
  });
}
