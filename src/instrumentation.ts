import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./server/env");
  Sentry.init({
    ...sentryOptions,
    dsn: env.SENTRY_DSN,
    tracesSampler: ({ normalizedRequest, inheritOrSampleWith }) =>
      normalizedRequest?.url?.endsWith("/api/healthz")
        ? 0
        : inheritOrSampleWith(1),
  });
}

export const onRequestError = Sentry.captureRequestError;
