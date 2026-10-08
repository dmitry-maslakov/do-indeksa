"use server";

import { streak } from "@/lib/stats";
import { getSession } from "./auth";
import { getStatAttempts } from "./history";

export async function getStreak(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  return streak(await getStatAttempts(session.user.id), new Date());
}
