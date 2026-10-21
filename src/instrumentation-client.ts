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

export const onRouterTransitionStart = routerTransitionStart;
