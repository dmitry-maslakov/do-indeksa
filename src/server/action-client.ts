import "server-only";
import { isbot } from "isbot";
import { headers } from "next/headers";
import { createSafeActionClient, returnServerError } from "next-safe-action";
import type { ServerError } from "@/lib/use-error-text";
import { ensureProfileId } from "./auth";
import { reportServerError } from "./report";

export const actionClient = createSafeActionClient({
  handleServerError: (error): ServerError => {
    reportServerError(error);
    return "unexpected";
  },
}).use(async ({ next }) => {
  if (isbot((await headers()).get("user-agent"))) returnServerError("bot");
  return next({ ctx: { profileId: await ensureProfileId() } });
});
