import "server-only";
import { createSafeActionClient } from "next-safe-action";
import type { ServerError } from "@/lib/use-error-text";
import { ensureProfileId } from "./auth";

export const actionClient = createSafeActionClient({
  handleServerError: (error): ServerError => {
    console.error(error);
    return "unexpected";
  },
}).use(async ({ next }) =>
  next({ ctx: { profileId: await ensureProfileId() } }),
);
