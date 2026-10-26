import "server-only";
import { skips } from "@/db/schema";
import { db } from "@/server/db";
import { liveSession } from "./sessions";

export const recordSkip = (
  profileId: string,
  taskId: string,
  sessionId: string | undefined,
) =>
  db.transaction(async (tx) => {
    const id = await liveSession(tx, profileId, taskId, sessionId);
    await tx.insert(skips).values({ profileId, taskId, sessionId: id });
    return id;
  });
