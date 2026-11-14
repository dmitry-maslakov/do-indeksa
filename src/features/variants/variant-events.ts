import { z } from "zod";
import { defineEvent, type EventMap } from "@/lib/analytics-schema";
import { readingProps } from "@/lib/reading";
import { isVariant } from "./variants";

const solutionsRead = defineEvent("solutions_read", {
  ...readingProps,
  variant_id: z.string().refine(isVariant),
});

export const clientEvents = [solutionsRead] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
