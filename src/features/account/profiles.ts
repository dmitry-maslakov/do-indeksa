import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  attempts,
  favorites,
  profiles,
  reports,
  suggestions,
  taskSessions,
  testSessions,
} from "@/db/schema";
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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const hasProgress = async (tx: Tx, profileId: string) =>
  (await tx.$count(attempts, eq(attempts.profileId, profileId))) +
    (await tx.$count(favorites, eq(favorites.profileId, profileId))) >
  0;

export async function adoptGuest(userId: string, token: string) {
  return db.transaction(async (tx) => {
    const [guest] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(eq(profiles.tokenHash, hashOf(token)), isNull(profiles.userId)),
      )
      .for("update");
    if (!guest) return false;
    const [own] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!own) {
      await tx
        .update(profiles)
        .set({ userId, tokenHash: null })
        .where(eq(profiles.id, guest.id));
      return false;
    }
    const both =
      (await hasProgress(tx, guest.id)) && (await hasProgress(tx, own.id));
    await tx
      .update(testSessions)
      .set({ profileId: own.id })
      .where(eq(testSessions.profileId, guest.id));
    await tx
      .update(taskSessions)
      .set({ profileId: own.id })
      .where(eq(taskSessions.profileId, guest.id));
    await tx
      .insert(favorites)
      .select(
        tx
          .select({
            profileId: sql`${own.id}::uuid`.as("profile_id"),
            taskId: favorites.taskId,
            createdAt: favorites.createdAt,
          })
          .from(favorites)
          .where(eq(favorites.profileId, guest.id)),
      )
      .onConflictDoNothing();
    await tx
      .update(reports)
      .set({ profileId: own.id })
      .where(eq(reports.profileId, guest.id));
    await tx
      .update(suggestions)
      .set({ profileId: own.id })
      .where(eq(suggestions.profileId, guest.id));
    await tx.delete(profiles).where(eq(profiles.id, guest.id));
    return both;
  });
}
