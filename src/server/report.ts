import "server-only";
import * as Sentry from "@sentry/nextjs";

export function reportServerError(error: unknown) {
  console.error(error);
  Sentry.captureException(error);
}
