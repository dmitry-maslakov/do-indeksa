import { z } from "zod";

export const sessionInput = z.object({
  id: z.uuid(),
  startedAt: z.number().int().positive(),
});

export type SessionInput = z.infer<typeof sessionInput>;
