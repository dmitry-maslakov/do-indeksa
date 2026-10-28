import { getProfileId } from "@/server/profile";
import { FavoriteButton } from "./favorite-button";
import { isFavorite } from "./favorites";

export async function FavoriteToggle({ taskId }: { taskId: string }) {
  const profileId = await getProfileId();
  const saved = await isFavorite(profileId, taskId);

  return <FavoriteButton key={profileId} taskId={taskId} saved={saved} />;
}
