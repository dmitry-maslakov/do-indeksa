import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { profiles } from "@/db/schema";
import { daySeconds } from "@/lib/dates";
import { getSession } from "./auth";
import { db } from "./db";

const profileCookie = "__Host-profile";
const noProfile = "00000000-0000-0000-0000-000000000000";
const profileCookieAge = 400 * daySeconds;
const profileCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

export const tokenHashOf = (token: string) =>
  createHash("sha256").update(token).digest("base64url");

async function profileOf(userId: string) {
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

async function guestProfileOf(token: string) {
  const [found] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(eq(profiles.tokenHash, tokenHashOf(token)), isNull(profiles.userId)),
    );
  return found?.id;
}

async function createGuestProfile() {
  const token = randomBytes(32).toString("base64url");
  const [created] = await db
    .insert(profiles)
    .values({ tokenHash: tokenHashOf(token) })
    .returning({ id: profiles.id });
  if (!created) throw new Error("guest profile was not created");
  return { id: created.id, token };
}

export async function guestToken() {
  return (await cookies()).get(profileCookie)?.value;
}

export async function forgetGuest() {
  (await cookies()).set(profileCookie, "", {
    ...profileCookieOptions,
    maxAge: 0,
  });
}

export const findProfileId = cache(async () => {
  const session = await getSession();
  if (session) return profileOf(session.user.id);
  const token = await guestToken();
  return token ? guestProfileOf(token) : undefined;
});

export const getProfileId = async () => (await findProfileId()) ?? noProfile;

export async function ensureProfileId() {
  const found = await findProfileId();
  if (found) return found;
  const { id, token } = await createGuestProfile();
  (await cookies()).set(profileCookie, token, {
    ...profileCookieOptions,
    maxAge: profileCookieAge,
  });
  return id;
}
