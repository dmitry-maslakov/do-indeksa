import "server-only";
import { z } from "zod";
import { getTask, idsByTopic } from "@/features/tasks/tasks";
import { topics } from "@/features/tasks/topics";
import { compose, composeModes, swap } from "@/lib/compose";
import { setId } from "@/lib/variant-id";
import { byNumber, byPosition } from "./variants";

const topicIds = topics.map((t) => t.id);

export const composeSchema = z.object({
  mode: z.enum(composeModes).catch("exam"),
  topic: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((t) => topicIds.filter((id) => [t].flat().includes(id))),
});

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

export const swapHrefs = (ids: string[]) =>
  ids.map((id, i) => {
    const same = idsByTopic.get(getTask(id)?.topic ?? "") ?? [];
    const swapped = swap(same, ids, i);
    return swapped && `/variants/${setId(swapped)}`;
  });
