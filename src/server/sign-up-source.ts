import "server-only";
import { getOAuthState } from "better-auth/api";

const signInSources = ["header", "result", "stats", "task"] as const;

export type SignInSource = (typeof signInSources)[number];

const oneTapCallback = "/one-tap/callback";

export async function signUpSource(path?: string) {
  if (path === oneTapCallback) return "one-tap";
  const state = await getOAuthState();
  return signInSources.find((source) => source === state?.from) ?? null;
}
