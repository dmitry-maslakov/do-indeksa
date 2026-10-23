import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import { io } from "next/cache";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import {
  adoptGuest,
  createGuestProfile,
  guestProfileOf,
  profileOf,
} from "@/features/account/profiles";
import { signUpSource } from "@/features/account/sign-up-source";
import { db } from "./db";
import { env } from "./env";
import { reportServerError } from "./report";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 300 },
  },
  user: {
    deleteUser: { enabled: true },
    additionalFields: {
      signUpSource: {
        type: "string",
        required: false,
        input: false,
        returned: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, signUpSource: await signUpSource() },
        }),
      },
    },
  },
  advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
  telemetry: { enabled: false },
  onAPIError: {
    onError: (error) => {
      if (!isAPIError(error) || error.status === "INTERNAL_SERVER_ERROR")
        reportServerError(error);
    },
  },
  plugins: [
    nextCookies(),
    ...(env.OAUTH_PROXY_SECRET
      ? [
          oAuthProxy({
            productionURL: env.OAUTH_PROXY_URL,
            currentURL: env.BETTER_AUTH_URL,
            secret: env.OAUTH_PROXY_SECRET,
          }),
        ]
      : []),
  ],
});

const getSession = cache(async () => {
  await io();
  return auth.api.getSession({ headers: await headers() });
});

const profileCookie = "__Host-profile";
const noProfile = "00000000-0000-0000-0000-000000000000";
const profileCookieAge = 400 * 24 * 60 * 60;
const profileCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

const findProfileId = cache(async () => {
  const session = await getSession();
  if (session) return profileOf(session.user.id);
  const token = (await cookies()).get(profileCookie)?.value;
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

export async function hasGuestToAdopt() {
  const [session, jar] = await Promise.all([getSession(), cookies()]);
  return Boolean(session && jar.has(profileCookie));
}

export async function adoptGuestProfile() {
  const [session, jar] = await Promise.all([getSession(), cookies()]);
  const token = jar.get(profileCookie)?.value;
  if (!session || !token) return false;
  const merged = await adoptGuest(session.user.id, token);
  jar.set(profileCookie, "", { ...profileCookieOptions, maxAge: 0 });
  return merged;
}
