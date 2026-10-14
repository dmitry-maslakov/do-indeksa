import { z } from "zod";
import { routing } from "@/i18n/routing";

export const pageQuery = z.object({
  offset: z.coerce.number().int().min(0),
  locale: z.enum(routing.locales),
});
