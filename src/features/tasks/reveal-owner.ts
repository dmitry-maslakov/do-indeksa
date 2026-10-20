import { z } from "zod";

export const revealOwner = z.union([
  z.object({ runId: z.uuid() }),
  z.object({ sessionId: z.uuid().optional() }),
]);

export type RevealOwner = z.infer<typeof revealOwner>;
