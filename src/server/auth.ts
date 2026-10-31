import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy, oneTap } from "better-auth/plugins";
import { io } from "next/cache";
import { headers } from "next/headers";
import { cache } from "react";
import { analyticsErasures } from "@/db/schema";
import { daySeconds } from "@/lib/dates";
import { track } from "./analytics";
import { db } from "./db";
import { env } from "./env";
import { accountDeleted, signedIn } from "./identity-events";
import { guestToken, markGuestToAdopt, profileIdOf } from "./profile";
import { reportServerError } from "./report";
import { isOneTap, signInSource, signUpSource } from "./sign-up-source";

const signUps = new Set<string>();

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
    expiresIn: 30 * daySeconds,
    updateAge: daySeconds,
    cookieCache: { enabled: true, maxAge: 300 },
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const profileId = await profileIdOf(user.id);
        if (profileId)
          await db
            .insert(analyticsErasures)
            .values({ profileId })
            .onConflictDoNothing();
      },
      afterDelete: () => track(accountDeleted, {}, { anonymous: true }),
    },
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
        before: async (user, ctx) => ({
          data: { ...user, signUpSource: await signUpSource(ctx?.path) },
        }),
        after: async (user) => {
          signUps.add(user.id);
        },
      },
    },
    session: {
      create: {
        after: async (session, ctx) => {
          try {
            const token = await guestToken();
            if (token) await markGuestToAdopt();
            await track(
              signedIn,
              {
                method: isOneTap(ctx?.path) ? "one_tap" : "google",
                from: await signInSource(),
                new_account: signUps.delete(session.userId),
                had_guest: Boolean(token),
              },
              { profileId: await profileIdOf(session.userId, token) },
            );
          } catch (error) {
            reportServerError(error);
          }
        },
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
    oneTap(),
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

export const getSession = cache(async () => {
  await io();
  return auth.api.getSession({ headers: await headers() });
});
