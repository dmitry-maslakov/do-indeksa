import { z } from "zod";
import { taskIdSchema } from "@/features/catalog/tasks";
import { topicIdSchema } from "@/features/catalog/topics";
import { placements } from "@/features/practice/practice-events";
import { defineEvent, type EventMap } from "@/lib/analytics-schema";
import { algoVersion } from "./queue/recommendation";

const recommendationMade = defineEvent("recommendation_made", {
  surface: z.enum(placements),
  task_id: taskIdSchema,
  topic: topicIdSchema,
  algo_version: z.literal(algoVersion),
  repeat: z.boolean(),
  slot: z.int().min(1).max(20),
});

export const clientEvents = [recommendationMade] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
