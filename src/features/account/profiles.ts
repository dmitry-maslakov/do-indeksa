import "server-only";
import { eq } from "drizzle-orm";
import { profiles } from "@/db/schema";
import { db } from "@/server/db";

export async function profileOf(userId: string) {
  const [found] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (found) return found.id;
  const [created] = await db
    .insert(profiles)
    .values({ userId })
    .onConflictDoUpdate({ target: profiles.userId, set: { userId } })
    .returning({ id: profiles.id });
  return created?.id;
}
