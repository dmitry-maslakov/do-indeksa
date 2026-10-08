import "server-only";
import { z } from "zod";
import { compose, composeModes, swap } from "@/lib/compose";
import { setId } from "@/lib/variant-id";
import { tasks } from "./tasks";
import { byNumber, byPosition } from "./variants";

export const composeSchema = z.object({
  mode: z.enum(composeModes).catch("exam"),
  topic: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((t) => (t === undefined ? [] : [t].flat())),
});

export const composeTaskIds = (
  input: Parameters<typeof compose>[1],
  seed: string,
) => byNumber(compose({ byPosition, tasks }, input, seed));

export const swapHrefs = (ids: string[]) =>
  ids.map((_, i) => {
    const swapped = swap(tasks, ids, i);
    return swapped && `/variants/${setId(swapped)}`;
  });
