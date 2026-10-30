import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import {
  attempts,
  profiles,
  reports,
  suggestions,
  taskSessions,
  testSessions,
} from "@/db/schema";
import { dayMs } from "@/lib/dates";
import { getSession } from "@/server/auth";
import { db, type Tx } from "@/server/db";
import { forgetGuest, guestToken, tokenHashOf } from "@/server/profile";

const hasProgress = async (tx: Tx, profileId: string) =>
  (await tx.$count(attempts, eq(attempts.profileId, profileId))) > 0;

async function mergeGuest(userId: string, token: string) {
  return db.transaction(async (tx) => {
    const [guest] = await tx
      .select({ id: profiles.id, createdAt: profiles.createdAt })
      .from(profiles)
      .where(
        and(
          eq(profiles.tokenHash, tokenHashOf(token)),
          isNull(profiles.userId),
        ),
      )
      .for("update");
    if (!guest) return;
    const [own] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    const guestProgress = await hasProgress(tx, guest.id);
    const guestAgeDays = Math.floor(
      (Date.now() - guest.createdAt.getTime()) / dayMs,
    );
    if (!own) {
      await tx
        .update(profiles)
        .set({ userId, tokenHash: null })
        .where(eq(profiles.id, guest.id));
      return {
        outcome: "claimed",
        from: guest.id,
        to: guest.id,
        guestProgress,
        ownProgress: false,
        guestAgeDays,
      } as const;
    }
    const ownProgress = await hasProgress(tx, own.id);
    await tx
      .update(testSessions)
      .set({ profileId: own.id })
      .where(eq(testSessions.profileId, guest.id));
    await tx
      .update(taskSessions)
      .set({ profileId: own.id })
      .where(eq(taskSessions.profileId, guest.id));
    await tx
      .update(reports)
      .set({ profileId: own.id })
      .where(eq(reports.profileId, guest.id));
    await tx
      .update(suggestions)
      .set({ profileId: own.id })
      .where(eq(suggestions.profileId, guest.id));
    await tx.delete(profiles).where(eq(profiles.id, guest.id));
    return {
      outcome: "merged",
      from: guest.id,
      to: own.id,
      guestProgress,
      ownProgress,
      guestAgeDays,
    } as const;
  });
}

export async function hasGuestToAdopt() {
  const [session, token] = await Promise.all([getSession(), guestToken()]);
  return Boolean(session && token);
}

export async function adoptGuestProfile() {
  const [session, token] = await Promise.all([getSession(), guestToken()]);
  if (!session || !token) return;
  const adopted = await mergeGuest(session.user.id, token);
  await forgetGuest();
  return adopted;
}
