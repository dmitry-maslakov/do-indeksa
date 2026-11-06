import { z } from "zod";
import { defineEvent, type EventMap } from "@/lib/analytics-schema";
import { readingProps } from "@/lib/reading";
import { getTheory, theoryMethods } from "./theory";

const theoryRead = defineEvent("theory_read", {
  ...readingProps,
  topic: z.string().refine((topic) => getTheory(topic) !== undefined),
  method: z
    .string()
    .refine((slug) => theoryMethods.some((m) => m.slug === slug))
    .optional(),
  page: z.enum(["topic", "methods", "method"]),
});

export const clientEvents = [theoryRead] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
