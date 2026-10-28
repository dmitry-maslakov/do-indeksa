import { z } from "zod";

export const partOutcomes = ["right", "wrong", "empty", "unreadable"] as const;

export type PartOutcome = (typeof partOutcomes)[number];

export const isRight = (outcome: PartOutcome) => outcome === "right";

export const sessionKinds = ["first", "retry", "mock"] as const;

export type SessionKind = (typeof sessionKinds)[number];

export const suggestionReasons = [
  "first",
  "stuck",
  "next",
  "almost",
  "started",
  "done",
] as const;

export type SuggestionReason = (typeof suggestionReasons)[number];

export const reportKinds = [
  "statement",
  "answer",
  "solution",
  "other",
] as const;

const visit = z.object({
  id: z.uuid(),
  task: z.number().int().min(0).max(9),
  startedAt: z.number().int(),
  endedAt: z.number().int(),
});

export const testDraft = z.object({
  answers: z.array(z.array(z.string().max(500)).max(6)).max(10),
  visits: z.array(visit).max(500),
});

export type Visit = z.infer<typeof visit>;
export type TestDraft = z.infer<typeof testDraft>;
