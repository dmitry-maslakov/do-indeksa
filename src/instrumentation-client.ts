import { navigationStarted, startAnalytics } from "@/lib/analytics-browser";
import {
  keepEarlyError,
  routerTransitionStart,
  startSentry,
} from "@/lib/sentry-browser";
import { siteUrl } from "@/lib/site";

if (location.host === siteUrl.host) {
  addEventListener("error", (event) => keepEarlyError(event.error));
  addEventListener("unhandledrejection", (event) =>
    keepEarlyError(event.reason),
  );
  addEventListener("load", startSentry);
}

startAnalytics();

export function onRouterTransitionStart(
  href: string,
  type: "push" | "replace" | "traverse",
) {
  routerTransitionStart(href, type);
  navigationStarted(type);
}
