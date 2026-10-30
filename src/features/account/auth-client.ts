import { createAuthClient } from "better-auth/react";
import { flush } from "@/lib/analytics-browser";
import type { SignInSource } from "@/server/sign-up-source";

export const authClient = createAuthClient();

export const signIn = (callbackURL: string, from?: SignInSource) =>
  authClient.signIn.social({
    provider: "google",
    callbackURL,
    additionalData: from && { from },
  });

export async function signOut(onSuccess: () => void) {
  await flush();
  return authClient.signOut({ fetchOptions: { onSuccess } });
}
