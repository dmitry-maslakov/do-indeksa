import { createAuthClient } from "better-auth/react";
import { flush, queueEvent } from "@/lib/analytics-browser";
import type { SignInSource } from "@/server/sign-up-source";

export const authClient = createAuthClient();

export function signIn(callbackURL: string, from: SignInSource) {
  queueEvent("sign_in_started", { from });
  flush();
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
    additionalData: { from },
  });
}

export async function signOut(onSuccess: () => void) {
  queueEvent("signed_out", {});
  await flush();
  return authClient.signOut({ fetchOptions: { onSuccess } });
}
