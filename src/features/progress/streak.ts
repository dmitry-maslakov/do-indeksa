import "server-only";
import { getRecentAttemptDays } from "./history";
import { streak } from "./stats";

export const getStreak = async (userId: string) =>
  streak(await getRecentAttemptDays(userId), new Date());
