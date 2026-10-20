import "server-only";
import { createSafeActionClient, returnServerError } from "next-safe-action";
import type { ServerError } from "@/lib/use-error-text";
import { getProfileId } from "./auth";

export const actionClient = createSafeActionClient({
  handleServerError: (error): ServerError => {
    console.error(error);
    return "unexpected";
  },
}).use(async ({ next }) => {
  return next({ ctx: { profileId: await getProfileId() } });
});

export const authActionClient = actionClient.use(
  ({ ctx: { profileId }, next }) => {
    if (!profileId) returnServerError("unauthorized");
    return next({ ctx: { profileId } });
  },
);
