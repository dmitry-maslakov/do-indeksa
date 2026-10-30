import { z } from "zod";
import { positions } from "@/features/catalog/exams";
import { levels } from "@/features/catalog/level";
import { taskIdSchema } from "@/features/catalog/tasks";
import { topicIdSchema } from "@/features/catalog/topics";
import { placements } from "@/features/practice/practice-events";
import { defineEvent, type EventMap } from "@/lib/analytics-schema";
import { sorts, sources, statusFilters } from "./params";
import { algoVersion } from "./queue/recommendation";
import type { BankQuery } from "./search";

const position = z.int().min(1).max(positions.length);

const recommendationMade = defineEvent("recommendation_made", {
  surface: z.enum(placements),
  task_id: taskIdSchema,
  topic: topicIdSchema,
  algo_version: z.literal(algoVersion),
  repeat: z.boolean(),
  slot: z.int().min(1).max(20),
});

const bankResultsShown = defineEvent("bank_results_shown", {
  topic: topicIdSchema.optional(),
  number: position.optional(),
  source: z.enum(sources).optional(),
  level: z.enum(levels).optional(),
  status: z.enum(statusFilters).optional(),
  sort: z.enum(sorts).optional(),
  q_len: z.int().min(1).max(100).optional(),
  results: z.int().min(0),
});

export const clientEvents = [recommendationMade, bankResultsShown] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}

export const resultsShown = (
  { q, topic, number, source, level, status, sort }: BankQuery,
  results: number,
) => ({
  topic: topicIdSchema.safeParse(topic).data,
  number: position.safeParse(number).data,
  source: source ?? undefined,
  level: level ?? undefined,
  status: status ?? undefined,
  sort: sort ?? undefined,
  q_len: q?.length,
  results,
});
