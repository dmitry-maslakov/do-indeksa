import "server-only";
import { getOAuthState } from "better-auth/api";

export const signInSources = [
  "header",
  "result",
  "stats",
  "task",
  "privacy",
] as const;

export type SignInSource = (typeof signInSources)[number];

export const isOneTap = (path?: string) => path === "/one-tap/callback";

export async function signInSource() {
  const state = await getOAuthState();
  return signInSources.find((source) => source === state?.from);
}

export async function signUpSource(path?: string) {
  return isOneTap(path) ? "one-tap" : ((await signInSource()) ?? null);
}
