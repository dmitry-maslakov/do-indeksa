import "server-only";
import { getOAuthState } from "better-auth/api";

const signInSources = ["header", "result", "stats", "task"] as const;

export type SignInSource = (typeof signInSources)[number];

export async function signUpSource() {
  const state = await getOAuthState();
  return signInSources.find((source) => source === state?.from) ?? null;
}
