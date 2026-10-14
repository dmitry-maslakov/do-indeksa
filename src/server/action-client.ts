import "server-only";
import { createSafeActionClient, returnServerError } from "next-safe-action";
import { getSession } from "./auth";

export const actionClient = createSafeActionClient().use(async ({ next }) => {
  const session = await getSession();
  return next({ ctx: { userId: session?.user.id } });
});

export const authActionClient = actionClient.use(
  ({ ctx: { userId }, next }) => {
    if (!userId) returnServerError("unauthorized");
    return next({ ctx: { userId } });
  },
);
