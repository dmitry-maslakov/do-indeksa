import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./server/env");
  Sentry.init({
    ...sentryOptions,
    dsn: env.SENTRY_DSN,
    tracesSampler: ({ normalizedRequest, inheritOrSampleWith }) =>
      /\/api\/(healthz|events)$/.test(normalizedRequest?.url ?? "")
        ? 0
        : inheritOrSampleWith(1),
  });
}

export const onRequestError = Sentry.captureRequestError;
