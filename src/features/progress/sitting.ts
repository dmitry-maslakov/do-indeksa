import "server-only";
import { cache } from "react";
import { noId } from "@/server/profile";
import { getPracticeLogsOf, getShownTasks } from "./attempt-log";
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
  const [log] = await getPracticeLogsOf(profileId, [taskId]);
  return log ? sittingState(log, Date.now(), attemptGapMs) : openSitting;
}

export const getAfterShown = cache(async (profileId: string) => {
  if (profileId === noId) return [];
  const shown = await getShownTasks(profileId);
  if (shown.size === 0) return [];
  const logs = await getPracticeLogsOf(profileId, [...shown]);
  const now = Date.now();
  return logs.flatMap((log) =>
    afterShown(log, now, attemptGapMs).map(({ id }) => ({
      id,
      taskId: log.taskId,
    })),
  );
});
