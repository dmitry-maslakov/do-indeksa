"use server";

import { getSession } from "@/server/auth";
import { getRecentAttemptDays } from "./history";
import { streak } from "./stats";

export async function getStreak(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  return streak(await getRecentAttemptDays(session.user.id), new Date());
}
