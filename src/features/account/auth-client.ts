import { createAuthClient } from "better-auth/react";
import type { SignInSource } from "@/server/sign-up-source";

export const authClient = createAuthClient();

export const signIn = (callbackURL: string, from?: SignInSource) =>
  authClient.signIn.social({
    provider: "google",
    callbackURL,
    additionalData: from && { from },
  });
