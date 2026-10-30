import "server-only";
import { isbot } from "isbot";
import { headers } from "next/headers";
import { createSafeActionClient, returnServerError } from "next-safe-action";
import { actionFailed } from "@/lib/site-events";
import { track } from "./analytics";
import { profileCreated } from "./identity-events";
import { ensureProfile, findProfileId } from "./profile";
import { reportServerError } from "./report";

export type ServerError = "unexpected" | "bot";

export const baseClient = createSafeActionClient({
  handleServerError: async (error, { ctx }): Promise<ServerError> => {
    reportServerError(error);
    await track(actionFailed, { reason: "unexpected", error: error.name }, ctx);
    return "unexpected";
  },
}).use(async ({ next }) => {
  if (isbot((await headers()).get("user-agent"))) {
    await track(actionFailed, { reason: "bot" });
    returnServerError("bot");
  }
  return next();
});

export const actionClient = baseClient.use(async ({ next }) => {
  const { id, created } = await ensureProfile();
  if (created)
    await track(profileCreated, { kind: created }, { profileId: id });
  return next({ ctx: { profileId: id } });
});

export const knownProfileClient = baseClient.use(async ({ next }) =>
  next({ ctx: { profileId: await findProfileId() } }),
);
