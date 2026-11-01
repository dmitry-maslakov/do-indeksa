import "server-only";
import { cache } from "react";
import { reveals } from "@/db/schema";
import { noId } from "@/server/profile";
import { getTaskLogsOf, getTasksWith, shownReveals } from "./attempt-log";
import { defaultPolicy } from "./learning/policy";
import {
  afterShown,
  openSitting,
  type SittingState,
  sittingState,
} from "./learning/sitting-state";

const { attemptGapMs } = defaultPolicy;

export async function getSittingState(
  profileId: string,
  taskId: string,
): Promise<SittingState> {
  const [log] = await getTaskLogsOf(profileId, [taskId]);
  return log ? sittingState(log, Date.now(), attemptGapMs) : openSitting;
}

export const getAfterShown = cache(
  async (profileId: string, taskIds?: string[]) => {
    if (profileId === noId) return [];
    const shown = await getTasksWith(reveals, profileId, taskIds, shownReveals);
    if (shown.size === 0) return [];
    const logs = await getTaskLogsOf(profileId, [...shown]);
    const now = Date.now();
    return logs.flatMap((log) =>
      afterShown(log, now, attemptGapMs).map((s) => s.id),
    );
  },
);
