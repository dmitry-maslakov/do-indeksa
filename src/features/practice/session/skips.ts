import "server-only";
import { skips } from "@/db/schema";
import { db } from "@/server/db";
import { liveSession } from "./task-sessions";

export const recordSkip = (
  profileId: string,
  taskId: string,
  sessionId: string | undefined,
) =>
  db.transaction(async (tx) => {
    const session = await liveSession(tx, profileId, taskId, sessionId);
    const [skip] = await tx
      .insert(skips)
      .values({ profileId, taskId, sessionId: session.id })
      .returning({ createdAt: skips.createdAt });
    if (!skip) throw new Error("skip was not saved");
    return { session, createdAt: skip.createdAt };
  });
