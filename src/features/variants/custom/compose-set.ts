import "server-only";
import { getTask, idsByTopic } from "@/features/catalog/tasks";
import { inExamOrder, positionPools } from "@/features/variants/variants";
import { compose, swap } from "./compose";

export const composeTaskIds = (
  examId: string,
  input: Parameters<typeof compose>[1],
  seed: string,
) => {
  const { ids, fallback } = compose(
    { byPosition: positionPools(examId), byTopic: idsByTopic },
    input,
    seed,
  );
  return { ids: inExamOrder(examId, ids), fallback };
};

export const swapIds = (ids: string[]) =>
  ids.map((id, i) =>
    swap(idsByTopic.get(getTask(id)?.topic ?? "") ?? [], ids, i),
  );
