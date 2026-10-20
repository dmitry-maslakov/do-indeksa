import { z } from "zod";
import { sessionInput } from "./session-input";

export const revealOwner = z.union([
  z.object({ session: sessionInput }),
  z.object({ runId: z.uuid() }),
]);

export type RevealOwner = z.infer<typeof revealOwner>;
