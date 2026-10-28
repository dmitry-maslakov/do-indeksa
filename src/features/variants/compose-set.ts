import "server-only";
import { z } from "zod";
import { positions } from "@/features/catalog/exams";
import { getTask, idsByTopic } from "@/features/catalog/tasks";
import { topics } from "@/features/catalog/topics";
import { compose, composeModes, swap } from "./compose";
import { setId } from "./variant-id";
import { byNumber, byPosition } from "./variants";

const topicIds = topics.map((t) => t.id);

export const composeSchema = z.object({
  mode: z.enum(composeModes).catch("exam"),
  topic: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((t) => topicIds.filter((id) => [t].flat().includes(id))),
  count: z.coerce
    .number()
    .int()
    .positive()
    .max(positions.length)
    .catch(positions.length),
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

export const swapIds = (ids: string[]) =>
  ids.map((id, i) => {
    const same = idsByTopic.get(getTask(id)?.topic ?? "") ?? [];
    const swapped = swap(same, ids, i);
    return swapped && setId(swapped);
  });
