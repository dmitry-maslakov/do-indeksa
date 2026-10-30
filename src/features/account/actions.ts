"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { analyticsOptedIn, analyticsOptedOut } from "@/lib/site-events";
import { baseClient } from "@/server/action-client";
import { setAnalyticsConsent, track } from "@/server/analytics";
import { adoptGuestProfile } from "./adopt";

export const adoptGuest = baseClient.action(async () => {
  const merged = await adoptGuestProfile();
  refresh();
  return merged;
});

export const setAnalytics = baseClient
  .inputSchema(z.object({ on: z.boolean() }))
  .action(async ({ parsedInput: { on } }) => {
    if (on) {
      await setAnalyticsConsent(true);
      await track(analyticsOptedIn, {}, { anonymous: true });
    } else {
      await track(analyticsOptedOut, {}, { anonymous: true });
      await setAnalyticsConsent(false);
    }
  });
