import type * as SentryModule from "@sentry/nextjs";
import { sentryOptions } from "./sentry";

const early: unknown[] = [];
let sentry: typeof SentryModule | undefined;

export function keepEarlyError(error: unknown) {
  if (!sentry && error) early.push(error);
}

export function reportError(error: Error & { digest?: string }) {
  if (error.digest) return;
  if (sentry) sentry.captureException(error);
  else early.push(error);
}

export async function startSentry() {
  const loaded = await import("@sentry/nextjs");
  loaded.init({ ...sentryOptions, dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
  sentry = loaded;
  for (const error of early.splice(0)) loaded.captureException(error);
}
