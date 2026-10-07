import "server-only";
import { z } from "zod";
import { pick } from "@/lib/pick";
import { positions } from "./exam";
import { tasks } from "./tasks";
import { byNumber, byPosition } from "./variants";

const composeModes = ["exam", "weak", "unsolved", "topics"] as const;

export const composeSchema = z.object({
  mode: z.enum(composeModes).catch("exam"),
  topic: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((t) => (t === undefined ? [] : [t].flat())),
  timer: z.string().optional(),
});

interface ComposeInput {
  mode: (typeof composeModes)[number];
  topics: string[];
  weak: string[];
  solved: Set<string>;
}

const fromTopics = (topics: string[], seed: string) =>
  pick(
    tasks.filter((t) => topics.includes(t.topic)).map((t) => [t.id]),
    positions.length,
    seed,
  );

export function composeTaskIds(input: ComposeInput, seed: string): string[] {
  const exam = () => pick(byPosition, positions.length, seed);
  const ids =
    input.mode === "weak"
      ? fromTopics(input.weak, seed)
      : input.mode === "topics"
        ? fromTopics(input.topics, seed)
        : input.mode === "unsolved"
          ? pick(
              byPosition.map((group) =>
                group.filter((id) => !input.solved.has(id)),
              ),
              positions.length,
              seed,
            )
          : exam();
  return byNumber(ids.length > 0 ? ids : exam());
}
