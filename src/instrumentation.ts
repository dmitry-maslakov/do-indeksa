import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./server/env");
  Sentry.init({ ...sentryOptions, dsn: env.SENTRY_DSN });
}

export const onRequestError = Sentry.captureRequestError;
