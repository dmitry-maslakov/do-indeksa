import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { profiles } from "@/db/schema";
import { db } from "@/server/db";

const hashOf = (token: string) =>
  createHash("sha256").update(token).digest("base64url");

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
  if (!created) throw new Error("profile was not created");
  return created.id;
}

export async function guestProfileOf(token: string) {
  const [found] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.tokenHash, hashOf(token)), isNull(profiles.userId)));
  return found?.id;
}

export async function createGuestProfile() {
  const token = randomBytes(32).toString("base64url");
  const [created] = await db
    .insert(profiles)
    .values({ tokenHash: hashOf(token) })
    .returning({ id: profiles.id });
  if (!created) throw new Error("guest profile was not created");
  return { id: created.id, token };
}
