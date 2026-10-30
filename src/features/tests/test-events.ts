import { z } from "zod";
import { testKind } from "@/db/schema";
import { defineEvent, text } from "@/lib/analytics-schema";

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
