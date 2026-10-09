import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { env } from "./env";

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
  advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
  telemetry: { enabled: false },
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

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
