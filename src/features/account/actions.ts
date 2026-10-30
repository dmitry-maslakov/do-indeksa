"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { actionClient, baseClient } from "@/server/action-client";
import { setAnalyticsConsent } from "@/server/analytics";
import { adoptGuestProfile } from "./adopt";

export const adoptGuest = actionClient.action(async () => {
  const merged = await adoptGuestProfile();
  refresh();
  return merged;
});

export const setAnalytics = baseClient
  .inputSchema(z.object({ on: z.boolean() }))
  .action(async ({ parsedInput: { on } }) => setAnalyticsConsent(on));
