import { z } from "zod";
import { defineEvent, type EventMap } from "@/lib/analytics-schema";
import { signInSources } from "@/server/sign-up-source";

const promptSources = ["task", "result", "stats", "one_tap"] as const;

export const profileMerged = defineEvent("profile_merged", {
  outcome: z.enum(["claimed", "merged"]),
  from_profile_id: z.uuid(),
  to_profile_id: z.uuid(),
  guest_had_progress: z.boolean(),
  own_had_progress: z.boolean(),
  guest_age_days: z.int().min(0),
});

const signInPromptShown = defineEvent("sign_in_prompt_shown", {
  from: z.enum(promptSources),
  solved: z.int().min(0).optional(),
});

const signInPromptClosed = defineEvent("sign_in_prompt_closed", {
  from: z.enum(promptSources),
  moment: z.enum(["display", "skipped", "dismissed"]).optional(),
  reason: z
    .enum(["credential_returned", "cancel_called", "flow_restarted"])
    .optional(),
});

const signInStarted = defineEvent("sign_in_started", {
  from: z.enum(signInSources),
});

const signedOut = defineEvent("signed_out", {});

export const clientEvents = [
  signInPromptShown,
  signInPromptClosed,
  signInStarted,
  signedOut,
] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
