"use server";

import { statAttempts } from "@/content/attempts";
import { streak } from "@/lib/stats";
import { getSession } from "./auth";
import { getAttempts } from "./history";

export async function getStreak(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  return streak(statAttempts(await getAttempts(session.user.id)), new Date());
}
