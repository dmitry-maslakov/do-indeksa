import "server-only";
import { z } from "zod";
import { reveals } from "@/db/schema";
import { getTask, renderTask } from "@/features/catalog/tasks";
import {
  liveSession,
  testTaskSession,
} from "@/features/practice/session/task-sessions";
import { db } from "@/server/db";

export const revealPartSchema = z.union([
  z.enum(["answer", "solution"]),
  z.number().int().min(0).max(2),
]);

export type RevealPart = z.infer<typeof revealPartSchema>;

export const revealOwner = z.union([
  z.object({ testSessionId: z.uuid() }),
  z.object({ sessionId: z.uuid().optional() }),
]);

type RevealOwner = z.infer<typeof revealOwner>;

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
    const session =
      "testSessionId" in owner
        ? {
            id: await testTaskSession(
              tx,
              profileId,
              taskId,
              owner.testSessionId,
            ),
            kind: "mock" as const,
            created: false,
          }
        : await liveSession(tx, profileId, taskId, owner.sessionId);
    const [reveal] = await tx
      .insert(reveals)
      .values({ profileId, taskId, part: stored, sessionId: session.id })
      .returning({ part: reveals.part, createdAt: reveals.createdAt });
    if (!reveal) throw new Error("reveal was not saved");
    return { session, ...reveal };
  });
}

export async function renderReveal(taskId: string, part: RevealPart) {
  const html = await renderTask(taskId);
  if (!html) return null;
  if (part === "answer") return html.answer;
  if (part === "solution") return html.solution;
  return html.hints[part] ?? null;
}
