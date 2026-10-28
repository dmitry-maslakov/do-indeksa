import { z } from "zod";

function knownTimeZone(value: string | undefined) {
  if (!value || value.length > 64) return undefined;
  try {
    return new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions()
      .timeZone;
  } catch {
    return undefined;
  }
}

export const timeZoneSchema = z
  .string()
  .max(64)
  .optional()
  .transform(knownTimeZone);

export const localTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
