import { z } from "zod";

export const hourMs = 60 * 60 * 1000;

export const dayMs = 24 * hourMs;

const timeZone = "Europe/Belgrade";

const belgrade = new Intl.DateTimeFormat("en-CA", { timeZone });

export const belgradeDate = (at = new Date()) => belgrade.format(at);

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
