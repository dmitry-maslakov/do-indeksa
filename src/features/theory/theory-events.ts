import { z } from "zod";
import { defineEvent, type EventMap, text } from "@/lib/analytics-schema";
import { getTheory, theoryMethods } from "./theory";

const theoryRead = defineEvent("theory_read", {
  read_id: z.uuid(),
  topic: z.string().refine((topic) => getTheory(topic) !== undefined),
  method: z
    .string()
    .refine((slug) => theoryMethods.some((m) => m.slug === slug))
    .optional(),
  page: z.enum(["topic", "methods", "method"]),
  sections: z.int().min(0),
  sections_reached: z.int().min(0),
  last_section: text.optional(),
  max_scroll_pct: z.int().min(0).max(100),
  visible_ms: z.int().min(0),
  exit: z.enum(["hidden", "pagehide", "navigate"]),
  seq: z.int().min(1),
});

export const clientEvents = [theoryRead] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
