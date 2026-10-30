"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { analyticsOptedIn, analyticsOptedOut } from "@/lib/site-events";
import { baseClient } from "@/server/action-client";
import { setAnalyticsConsent, track } from "@/server/analytics";
import { profileMerged } from "./account-events";
import { adoptGuestProfile } from "./adopt";

export const adoptGuest = baseClient.action(async () => {
  const adopted = await adoptGuestProfile();
  refresh();
  if (!adopted) return false;
  const { outcome, from, to, guestProgress, ownProgress, guestAgeDays } =
    adopted;
  await track(
    profileMerged,
    {
      outcome,
      from_profile_id: from,
      to_profile_id: to,
      guest_had_progress: guestProgress,
      own_had_progress: ownProgress,
      guest_age_days: guestAgeDays,
    },
    { profileId: to },
  );
  return guestProgress && ownProgress;
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
