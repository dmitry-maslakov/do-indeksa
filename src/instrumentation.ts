import * as Sentry from "@sentry/nextjs";
import { isbot } from "isbot";
import { sentryOptions } from "@/lib/sentry";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./server/env");
  Sentry.init({
    ...sentryOptions,
    dsn: env.SENTRY_DSN,
    integrations: [
      Sentry.httpIntegration({
        disableIncomingRequestSpans: true,
        sessions: false,
      }),
    ],
    tracesSampler: ({ normalizedRequest: request, inheritOrSampleWith }) =>
      request?.method === "HEAD" ||
      isbot(request?.headers?.["user-agent"]) ||
      /\/api\/(healthz|events)$/.test(request?.url ?? "")
        ? 0
        : inheritOrSampleWith(1),
  });
}

export const onRequestError = Sentry.captureRequestError;
