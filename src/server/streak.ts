"use server";

import { streak } from "@/lib/stats";
import { getSession } from "./auth";
import { getRecentAttemptDays } from "./history";

export async function getStreak(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  return streak(await getRecentAttemptDays(session.user.id), new Date());
}
