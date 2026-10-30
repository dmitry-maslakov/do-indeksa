import { z } from "zod";
import { suggestionReasons } from "@/db/columns";
import { topicIdSchema } from "@/features/catalog/topics";
import { defineEvent, type EventMap } from "@/lib/analytics-schema";

const suggestion = {
  suggestion_id: z.uuid().optional(),
  topic: topicIdSchema,
  reason: z.enum(suggestionReasons),
};

export const suggestionShown = defineEvent("suggestion_shown", suggestion);

const suggestionOpened = defineEvent("suggestion_opened", {
  ...suggestion,
  since_shown_ms: z.int().min(0),
});

export const clientEvents = [suggestionOpened] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
