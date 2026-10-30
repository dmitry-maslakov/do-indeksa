import { z } from "zod";
import { defineEvent } from "@/lib/analytics-schema";
import { signInSources } from "./sign-up-source";

export const profileCreated = defineEvent("profile_created", {
  kind: z.enum(["guest", "account"]),
});

export const signedIn = defineEvent("signed_in", {
  method: z.enum(["google", "one_tap"]),
  from: z.enum(signInSources).optional(),
  new_account: z.boolean(),
  had_guest: z.boolean(),
});
