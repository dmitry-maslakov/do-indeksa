import "server-only";
import { z } from "zod";

export const env = z
  .object({
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    OAUTH_PROXY_URL: z.url().optional(),
    OAUTH_PROXY_SECRET: z.string().min(32).optional(),
  })
  .parse(process.env);
