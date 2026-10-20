import { getSession } from "@/server/auth";
import { FavoriteButton } from "./favorite-button";
import { isFavorite } from "./favorites";

export async function FavoriteToggle({ taskId }: { taskId: string }) {
  const session = await getSession();
  const saved = session ? await isFavorite(session.user.id, taskId) : false;

  return (
    <FavoriteButton
      key={session?.user.id}
      taskId={taskId}
      saved={saved}
      signedIn={Boolean(session)}
      compact
    />
  );
}
