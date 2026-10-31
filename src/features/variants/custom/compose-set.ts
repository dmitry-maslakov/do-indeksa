import "server-only";
import { getTask, idsByTopic } from "@/features/catalog/tasks";
import { byNumber, byPosition } from "@/features/variants/variants";
import { compose, swap } from "./compose";

export const composeTaskIds = (
  input: Parameters<typeof compose>[1],
  seed: string,
) => {
  const { ids, fallback } = compose(
    { byPosition, byTopic: idsByTopic },
    input,
    seed,
  );
  return { ids: byNumber(ids), fallback };
};

export const swapIds = (ids: string[]) =>
  ids.map((id, i) =>
    swap(idsByTopic.get(getTask(id)?.topic ?? "") ?? [], ids, i),
  );
