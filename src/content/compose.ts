import "server-only";
import { z } from "zod";
import { compose, composeModes } from "@/lib/compose";
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
