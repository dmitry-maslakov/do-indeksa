import { z } from "zod";
import { defineEvent } from "@/lib/analytics-schema";

export const profileCreated = defineEvent("profile_created", {
  kind: z.enum(["guest", "account"]),
});
