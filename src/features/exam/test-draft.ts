import { z } from "zod";

const visitInput = z.object({
  id: z.uuid(),
  task: z.number().int().min(0).max(9),
  startedAt: z.number().int(),
  endedAt: z.number().int(),
});

export const testDraft = z.object({
  answers: z.array(z.array(z.string().max(500)).max(6)).max(10),
  visits: z.array(visitInput).max(500),
});

export type Visit = z.infer<typeof visitInput>;
export type TestDraft = z.infer<typeof testDraft>;
