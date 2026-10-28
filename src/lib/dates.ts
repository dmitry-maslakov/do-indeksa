import { z } from "zod";

export const secondMs = 1000;

export const minuteMs = 60 * secondMs;

export const hourMs = 60 * minuteMs;

export const dayMs = 24 * hourMs;

export const daySeconds = dayMs / secondMs;

export const toMinutes = (ms: number) => Math.round(ms / minuteMs);

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
