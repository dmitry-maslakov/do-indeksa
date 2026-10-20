import { getProfileId, getSession } from "@/server/auth";
import { FavoriteButton } from "./favorite-button";
import { isFavorite } from "./favorites";

export async function FavoriteToggle({ taskId }: { taskId: string }) {
  const [session, profileId] = await Promise.all([
    getSession(),
    getProfileId(),
  ]);
  const saved = profileId ? await isFavorite(profileId, taskId) : false;

  return (
    <FavoriteButton
      key={profileId}
      taskId={taskId}
      saved={saved}
      signedIn={Boolean(session)}
      compact
    />
  );
}
