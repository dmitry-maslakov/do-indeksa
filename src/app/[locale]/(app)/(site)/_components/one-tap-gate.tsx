import { GoogleOneTap } from "@/features/account/google-one-tap";
import { isReturningGuest } from "@/features/account/nudge";
import { getSolved } from "@/features/progress/progress";
import { getSession } from "@/server/auth";
import { env } from "@/server/env";
import { findProfileId } from "@/server/profile";

export async function OneTapGate() {
  if (await getSession()) return null;
  const profileId = await findProfileId();
  const solved = profileId ? await getSolved(profileId) : [];
  return (
    isReturningGuest(solved.map((s) => s.createdAt)) && (
      <GoogleOneTap clientId={env.GOOGLE_CLIENT_ID} />
    )
  );
}
