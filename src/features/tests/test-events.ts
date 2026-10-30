import { z } from "zod";
import { testKind } from "@/db/schema";
import { composeModes } from "@/features/variants/custom/compose";
import { defineEvent, type EventMap, text } from "@/lib/analytics-schema";

const count = z.int().min(0);
const duration = z.int().overwrite((ms) => Math.max(0, ms));
const ordinal = z.int().positive();
const testSessionId = z.uuid();
const variantKind = z.enum(testKind.enumValues);

const testFacts = {
  test_session_id: testSessionId,
  variant_id: text,
  variant_kind: variantKind,
  tasks: ordinal,
  minutes: count,
};

const testStarted = defineEvent("test_started", {
  ...testFacts,
  fallback: z.enum(composeModes).optional(),
});

const testResumed = defineEvent("test_resumed", {
  ...testFacts,
  from: z.enum(["local", "server"]),
  away_ms: duration,
  answered: count,
});

const testTaskViewed = defineEvent("test_task_viewed", {
  test_session_id: testSessionId,
  variant_kind: variantKind,
  position: ordinal,
  task_id: text,
  visit_no: ordinal,
  nav: z.enum(["start", "next", "prev", "rail", "bar", "resume"]),
  prev_position: ordinal.optional(),
  prev_dwell_ms: duration.optional(),
  answered: count,
  elapsed_ms: duration,
});

const testTaskSwapped = defineEvent("test_task_swapped", {
  test_session_id: testSessionId,
  to_test_session_id: testSessionId.optional(),
  position: ordinal,
  from_task_id: text,
  to_task_id: text.optional(),
});

const testLeft = defineEvent("test_left", {
  test_session_id: testSessionId,
  position: ordinal,
  answered: count,
  elapsed_ms: duration,
  over: z.boolean(),
  exit: z.enum(["hidden", "pagehide", "navigate"]),
  seq: ordinal,
});

export const testFinished = defineEvent("test_finished", {
  ...testFacts,
  weekly: z.boolean(),
  answered: count,
  correct: count,
  score: z.number().min(0),
  max_points: count,
  elapsed_ms: duration,
  overtime: z.boolean(),
  overtime_ms: duration.optional(),
  unanswered: z.array(ordinal).max(30),
  visits: count,
  positions_visited: count,
});

export const clientEvents = [
  testStarted,
  testResumed,
  testTaskViewed,
  testTaskSwapped,
  testLeft,
] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
