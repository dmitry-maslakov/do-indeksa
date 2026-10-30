import { z } from "zod";
import { defineEvent } from "@/lib/analytics-schema";

export const profileMerged = defineEvent("profile_merged", {
  outcome: z.enum(["claimed", "merged"]),
  from_profile_id: z.uuid(),
  to_profile_id: z.uuid(),
  guest_had_progress: z.boolean(),
  own_had_progress: z.boolean(),
  guest_age_days: z.int().min(0),
});
