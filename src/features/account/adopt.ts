import "server-only";
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
import { getSession } from "@/server/auth";
import { db, type Tx } from "@/server/db";
import { forgetGuest, guestToken, tokenHashOf } from "@/server/profile";

const hasProgress = async (tx: Tx, profileId: string) =>
  (await tx.$count(attempts, eq(attempts.profileId, profileId))) +
    (await tx.$count(favorites, eq(favorites.profileId, profileId))) >
  0;

async function mergeGuest(userId: string, token: string) {
  return db.transaction(async (tx) => {
    const [guest] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.tokenHash, tokenHashOf(token)),
          isNull(profiles.userId),
        ),
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

export async function hasGuestToAdopt() {
  const [session, token] = await Promise.all([getSession(), guestToken()]);
  return Boolean(session && token);
}

export async function adoptGuestProfile() {
  const [session, token] = await Promise.all([getSession(), guestToken()]);
  if (!session || !token) return false;
  const merged = await mergeGuest(session.user.id, token);
  await forgetGuest();
  return merged;
}
