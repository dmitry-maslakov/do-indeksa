import "server-only";
import { createSafeActionClient, returnServerError } from "next-safe-action";
import type { ServerError } from "@/lib/use-error-text";
import { getSession } from "./auth";

export const actionClient = createSafeActionClient({
  handleServerError: (error): ServerError => {
    console.error(error);
    return "unexpected";
  },
}).use(async ({ next }) => {
  const session = await getSession();
  return next({ ctx: { userId: session?.user.id } });
});

export const authActionClient = actionClient.use(
  ({ ctx: { userId }, next }) => {
    if (!userId) returnServerError("unauthorized");
    return next({ ctx: { userId } });
  },
);
