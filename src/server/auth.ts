import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import { io } from "next/cache";
import { headers } from "next/headers";
import { cache } from "react";
import { daySeconds } from "@/lib/dates";
import { db } from "./db";
import { env } from "./env";
import { reportServerError } from "./report";
import { signUpSource } from "./sign-up-source";

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

export const getSession = cache(async () => {
  await io();
  return auth.api.getSession({ headers: await headers() });
});
